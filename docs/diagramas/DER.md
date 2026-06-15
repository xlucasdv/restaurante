erDiagram
    Usuario {
        string id PK
        string nome
        string email UK
        string senha
        string perfil
        datetime criadoEm
    }
    
    Unidade {
        string id PK
        string nome
        string endereco
        boolean ativo
        datetime criadoEm
    }
    
    Produto {
        string id PK
        string nome
        string descricao
        float preco
        string categoria
        boolean disponivel
        string unidadeId FK
        datetime criadoEm
    }
    
    Estoque {
        string id PK
        string produtoId FK
        string unidadeId FK
        int qtdAtual
        datetime atualizadoEm
    }
    
    Pedido {
        string id PK
        string clienteId FK
        string unidadeId FK
        string canalPedido
        string status
        float valorTotal
        string idempotenciaKey UK
        datetime criadoEm
    }
    
    ItemPedido {
        string id PK
        string pedidoId FK
        string produtoId FK
        int quantidade
        float precoUnitario
    }
    
    Pagamento {
        string id PK
        string pedidoId FK
        float valor
        string status
        string metodo
        string transacaoId
        datetime processadoEm
    }
    
    Fidelidade {
        string id PK
        string clienteId FK
        int pontos
        boolean consentimento
        datetime criadoEm
    }
    
    LogAuditoria {
        string id PK
        string usuarioId FK
        string acao
        string entidade
        string entidadeId
        string detalhes
        datetime criadoEm
    }

    Usuario ||--o{ Pedido : "faz"
    Usuario ||--o{ LogAuditoria : "realiza"
    Usuario ||--o| Fidelidade : "possui"
    
    Unidade ||--o{ Produto : "contém"
    Unidade ||--o{ Pedido : "recebe"
    Unidade ||--o{ Estoque : "gerencia"
    
    Produto ||--o{ ItemPedido : "incluído em"
    Produto ||--o| Estoque : "controlado por"
    
    Pedido ||--|{ ItemPedido : "contém"
    Pedido ||--o| Pagamento : "processa"
    
    ItemPedido }o--|| Produto : "referencia"
    ItemPedido }o--|| Pedido : "pertence a"
    
    Pagamento }o--|| Pedido : "referencia"
    Fidelidade }o--|| Usuario : "pertence a"
    LogAuditoria }o--|| Usuario : "registra"