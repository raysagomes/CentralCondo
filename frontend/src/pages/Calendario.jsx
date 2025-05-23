import React from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/calendario.css';
import { FaCalendarAlt } from 'react-icons/fa';

export default function Calendario() {
    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div className="sidebar-container" style={{ width: '250px', marginTop: '60px' }}>
                <Sidebar />
            </div>
            <div className="calendario-container">
                <div className="calendario-header">
                    <h1>Calendário</h1>
                    <FaCalendarAlt size={50} className="icon-header" />
                </div>

                <div className="calendario-conteudo">
                    <div className="calendario-box">
                        <img src="/caminho/para/imagem-do-calendario.png" alt="Calendário de Abril 2025" className="imagem-calendario" />
                    </div>
                    <div className="legenda">
                        <div>
                            <h4>manutenções</h4>
                            <p><span className="cor-legenda roxo"></span> internet</p>
                            <p><span className="cor-legenda amarelo"></span> elevador</p>
                        </div>
                        <div>
                            <h4>reunião</h4>
                            <p><span className="cor-legenda verde"></span> reunião mensal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
