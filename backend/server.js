const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const util = require('util');
const query = util.promisify(db.query).bind(db);

app.post('/register', async (req, res) => {
    const { first_name, last_name, email, password, role, newEntityName } = req.body;

    if (role !== 'admin') {
        return res.status(400).json({ error: 'Somente administradores podem se registrar diretamente.' });
    }

    if (!newEntityName || newEntityName.trim() === '') {
        return res.status(400).json({ error: 'Nome da nova entidade é obrigatório para administradores.' });
    }

    try {
        const entityResult = await query('INSERT INTO entities (name) VALUES (?)', [newEntityName.trim()]);
        const associatedEntityId = entityResult.insertId;
        const hash = await bcrypt.hash(password, 10);
        const insertUserQuery = `
            INSERT INTO users (first_name, last_name, email, password, role, entity_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await query(insertUserQuery, [first_name, last_name, email, hash, 'admin', associatedEntityId]);

        res.json({ message: 'Usuário registrado e associado à entidade com sucesso' });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email já está em uso' });
        }
        return res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno no servidor' });

        if (results.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Senha incorreta' });

        const entityId = user.entity_id;

        if (!entityId) {
            return res.status(401).json({ error: 'Usuário sem entidade associada' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, entityId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            role: user.role,
            entityId
        });
    });
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token não enviado' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token mal formatado' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
        req.user = user;
        next();
    });
}

function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    next();
}

app.get('/admin/members', authenticateToken, isAdmin, (req, res) => {
    db.query("SELECT id, first_name, last_name, email FROM users WHERE role = 'member'", (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar membros' });
        res.json(results);
    });
});

app.get('/admin/entities', authenticateToken, isAdmin, (req, res) => {
    db.query("SELECT * FROM entities", (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar entidades' });
        res.json(results);
    });
});

app.post('/admin/entities', authenticateToken, isAdmin, (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome da entidade é obrigatório' });

    db.query('INSERT INTO entities (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro ao adicionar entidade' });
        res.json({ message: 'Entidade adicionada com sucesso', entityId: result.insertId });
    });
});

app.post('/admin/associate', authenticateToken, isAdmin, (req, res) => {
    const { userId, entityId } = req.body;
    if (!userId || !entityId) return res.status(400).json({ error: 'Dados incompletos' });

    db.query(
        'UPDATE users SET entity_id = ? WHERE id = ?',
        [entityId, userId],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Erro ao associar membro à entidade' });
            res.json({ message: 'Associação feita com sucesso' });
        }
    );
});

app.get('/entity/:id/data', authenticateToken, (req, res) => {
    const userEntityId = req.user.entityId;
    const entityIdParam = parseInt(req.params.id, 10);

    if (userEntityId !== entityIdParam) {
        return res.status(403).json({ error: 'Acesso negado à entidade' });
    }

    db.query('SELECT * FROM entities WHERE id = ?', [entityIdParam], (err, data) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar dados da entidade' });
        if (!data[0]) return res.status(404).json({ error: 'Entidade não encontrada' });

        res.json(data[0]);
    });
});

app.get('/notices/:entityId', authenticateToken, async (req, res) => {
    const { entityId } = req.params;

    if (req.user.entityId !== parseInt(entityId, 10)) {
        return res.status(403).json({ error: 'Acesso negado à entidade' });
    }

    try {
        const rows = await query(
            'SELECT id, entityId, message, createdBy, createdAt FROM notices WHERE entityId = ? ORDER BY createdAt DESC',
            [entityId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar avisos' });
    }
});


function verifyTokenAndAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado: Admins somente' });
        }
        next();
    });
}

app.post('/notices', verifyTokenAndAdmin, async (req, res) => {
    const { entityId, message } = req.body;
    const createdBy = req.user.id;

    if (!entityId || !message) {
        return res.status(400).json({ error: 'entityId e message são obrigatórios' });
    }

    try {
        const result = await query(
            'INSERT INTO notices (entityId, message, createdBy) VALUES (?, ?, ?)',
            [entityId, message, createdBy]
        );
        res.status(201).json({
            id: result.insertId,
            entityId,
            message,
            createdBy,
            createdAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar aviso' });
    }
});

app.delete('/notices/:id', verifyTokenAndAdmin, (req, res) => {
    const noticeId = req.params.id;

    db.query('DELETE FROM notices WHERE id = ?', [noticeId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro ao deletar aviso' });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Aviso não encontrado' });
        }

        res.json({ message: 'Aviso deletado com sucesso' });
    });
});

app.post('/create-member', authenticateToken, isAdmin, async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const adminId = req.user.id;

    try {
        const [adminResult] = await db.promise().query('SELECT * FROM users WHERE id = ?', [adminId]);
        const admin = adminResult[0];

        if (!admin || !admin.entity_id) {
            return res.status(400).json({ error: 'Admin sem entidade associada' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.promise().query(
            `INSERT INTO users (email, password, role, entity_id, first_name, last_name) 
             VALUES (?, ?, 'member', ?, ?, ?)`,
            [email, hashedPassword, admin.entity_id, first_name, last_name]
        );

        res.status(201).json({ message: 'Membro criado com sucesso!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar membro' });
    }
});

app.get('/members', authenticateToken, async (req, res) => {
    const entityId = req.user.entityId;
  
    try {
      const [members] = await db.promise().query(
        `SELECT id, first_name, last_name, email 
         FROM users 
         WHERE entity_id = ? AND role = 'member'`,
        [entityId]
      );
      res.json(members);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar membros' });
    }
  });
  

app.listen(3001, () => {
    console.log('🚀 Servidor rodando em http://localhost:3001');
});
