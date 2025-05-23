import React from 'react';
import { Card, Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function LinkCards() {
    const cards = [
        {
            title: 'Inquilinos',
            link: '/inquilinos',
        },
        {
            title: 'Pagamentos',
            link: '/pagamentos',
        },
        {
            title: 'Calendário',
            link: '/calendario',
        },
    ];

    return (
        <Container style={{ marginTop: '2rem' }}>
            <Row className="g-4">
                {cards.map(({ title, link }) => (
                    <Col key={title} md={4}>
                        <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <Card className="h-100">
                                <Card.Body className="d-flex align-items-center justify-content-center">
                                    <Card.Title>{title}</Card.Title>
                                </Card.Body>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}
