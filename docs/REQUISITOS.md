# 📋 Requisitos do Sistema - Restaurante API

## 1. Contexto e Estudo de Caso

### 1.1 Cenário do Negócio

Este projeto atende uma **rede de restaurantes/franquia** com múltiplas unidades (filiais), necessitando de um sistema centralizado para:

- Gerenciar cardápios por unidade
- Processar pedidos de múltiplos canais (APP, WEB, TOTEM, BALCAO, PICKUP)
- Controlar estoque por unidade
- Processar pagamentos via gateway externo
- Fidelizar clientes com programa de pontos
- Garantir conformidade com LGPD

### 1.2 Atores do Sistema

| Ator | Perfil | Permissões |
|------|--------|------------|
| **CLIENTE** | Cliente final | Criar pedidos, consultar próprios pedidos, acumular pontos |
| **GERENTE** | Gestor da unidade | Acesso total (produtos, pedidos, relatórios, pagamentos) |
| **COZINHA** | Equipe de preparo | Atualizar status dos pedidos |
| **ATENDENTE** | Caixa/balcão | Processar pagamentos |

---

## 2. Requisitos Funcionais (RF)

### 2.1 Autenticação e Autorização

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RF001** | O sistema deve permitir login com email e senha | Alta | ✅ Implementado |
| **RF002** | O sistema deve gerar token JWT válido por 15 minutos | Alta | ✅ Implementado |
| **RF003** | O sistema deve validar perfil do usuário antes de ações críticas | Alta | ✅ Implementado |
| **RF004** | O sistema deve armazenar senhas com hash bcrypt | Alta | ✅ Implementado |

### 2.2 Gestão de Produtos

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RF010** | O sistema deve permitir cadastro de produtos por unidade | Alta | ✅ Implementado |
| **RF011** | O sistema deve permitir listagem pública de produtos | Alta | ✅ Implementado |
| **RF012** | O sistema deve permitir atualização de produtos (apenas GERENTE) | Média | ✅ Implementado |
| **RF013** | O sistema deve permitir exclusão de produtos sem histórico | Baixa | ✅ Implementado |
| **RF014** | O sistema deve impedir exclusão de produtos com pedidos | Média | ✅ Implementado |
| **RF015** | O sistema deve permitir filtrar produtos por categoria e disponibilidade | Média | ✅ Implementado |

### 2.3 Gestão de Pedidos (Fluxo Principal)

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RF020** | O sistema deve permitir criação de pedidos com múltiplos itens | Alta | ✅ Implementado |
| **RF021** | O sistema deve registrar o canal de origem do pedido (multicanalidade) | Alta | ✅ Implementado |
| **RF022** | O sistema deve validar estoque antes de criar pedido | Alta | ✅ Implementado |
| **RF023** | O sistema deve debitar estoque automaticamente ao criar pedido | Alta | ✅ Implementado |
| **RF024** | O sistema deve calcular valor total automaticamente | Alta | ✅ Implementado |
| **RF025** | O sistema deve permitir consulta de pedidos com paginação | Média | ✅ Implementado |
| **RF026** | O sistema deve permitir busca de pedido por ID | Alta | ✅ Implementado |
| **RF027** | O sistema deve permitir atualização de status (COZINHA/GERENTE) | Alta | ✅ Implementado |
| **RF028** | O sistema deve impedir cliente de ver pedidos de outros | Alta | ✅ Implementado |
| **RF029** | O sistema deve suportar idempotência para evitar duplicidade | Média | ✅ Implementado |

### 2.4 Pagamentos

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RF030** | O sistema deve integrar com gateway de pagamento externo | Alta | ✅ Mock Implementado |
| **RF031** | O sistema deve simular aprovação e recusa de pagamento | Alta | ✅ Implementado |
| **RF032** | O sistema deve registrar transação com ID único | Alta | ✅ Implementado |
| **RF033** | O sistema deve permitir apenas GERENTE/ATENDENTE processar pagamento | Média | ✅ Implementado |

### 2.5 Programa de Fidelidade

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RF040** | O sistema deve registrar consentimento LGPD do cliente | Alta | ✅ Implementado |
| **RF041** | O sistema deve acumular pontos por pedido | Média | ✅ Implementado |
| **RF042** | O sistema deve permitir consulta de saldo de pontos | Média | ✅ Implementado |

### 2.6 Auditoria e Rastreabilidade

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RF050** | O sistema deve registrar ações sensíveis (criar pedido, mudar status) | Alta | ✅ Implementado |
| **RF051** | O sistema deve registrar quem fez, o que fez e quando | Alta | ✅ Implementado |
| **RF052** | O sistema deve armazenar detalhes da ação em JSON | Média | ✅ Implementado |

---

## 3. Requisitos Não-Funcionais (RNF)

### 3.1 Desempenho e Escalabilidade

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RNF001** | A API deve responder em até 500ms para consultas simples | Alta | ✅ Atendido |
| **RNF002** | O sistema deve suportar paginação em listagens grandes | Média | ✅ Implementado |
| **RNF003** | O banco deve usar SQLite para desenvolvimento e PostgreSQL para produção | Média | ✅ Configurado |

### 3.2 Segurança

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RNF010** | O sistema deve usar HTTPS em produção | Alta | ⏳ Deploy |
| **RNF011** | O sistema deve usar JWT com expiração configurável | Alta | ✅ Implementado |
| **RNF012** | O sistema deve usar bcrypt com salt para senhas | Alta | ✅ Implementado |
| **RNF013** | O sistema não deve expor dados sensíveis em respostas | Alta | ✅ Implementado |
| **RNF014** | O sistema deve validar todos os dados de entrada (Zod) | Alta | ✅ Implementado |
| **RNF015** | O sistema deve usar helmet para headers de segurança | Média | ✅ Implementado |
| **RNF016** | O sistema deve usar CORS configurado | Média | ✅ Implementado |

### 3.3 Qualidade de Código

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RNF020** | O código deve ser escrito em TypeScript | Alta | ✅ Implementado |
| **RNF021** | O sistema deve seguir arquitetura em camadas | Alta | ✅ Implementado |
| **RNF022** | O sistema deve ter tratamento de erros global | Alta | ✅ Implementado |
| **RNF023** | O sistema deve ter documentação OpenAPI/Swagger | Alta | ✅ Implementado |
| **RNF024** | O sistema deve ter testes automatizados | Média | ⏳ Parcial |

### 3.4 Manutenibilidade

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| **RNF030** | O sistema deve usar ORM (Prisma) para banco de dados | Alta | ✅ Implementado |
| **RNF031** | O sistema deve ter migrations versionadas | Alta | ✅ Implementado |
| **RNF032** | O sistema deve usar variáveis de ambiente (.env) | Alta | ✅ Implementado |
| **RNF033** | O sistema deve ter README completo | Alta | ✅ Implementado |

---

## 4. Multicanalidade (Requisito de Domínio)

### 4.1 Canais de Pedido Suportados

O sistema deve registrar e rastrear a origem de cada pedido:

| Canal | Código | Descrição |
|-------|--------|-----------|
| **APP** | `APP` | Aplicativo mobile (iOS/Android) |
| **WEB** | `WEB` | Site/web responsivo |
| **TOTEM** | `TOTEM` | Totem de autoatendimento físico |
| **BALCAO** | `BALCAO` | Pedido presencial no balcão |
| **PICKUP** | `PICKUP` | Pedido para retirada no local |

### 4.2 Rastreabilidade por Canal

- **Campo `canalPedido`** obrigatório na criação de pedidos
- **Filtro por canal** na listagem de pedidos
- **Relatórios** por canal de origem (para análise de negócio)
- **Auditoria** registra canal em todas as operações

---

## 5. LGPD (Lei Geral de Proteção de Dados)

### 5.1 Dados Pessoais Coletados

| Dado | Finalidade | Base Legal |
|------|------------|------------|
| Nome | Identificação do cliente | Execução de contrato |
| Email | Login e comunicação | Execução de contrato |
| Senha (hash) | Autenticação | Segurança |
| Histórico de pedidos | Fidelidade e suporte | Legítimo interesse |

### 5.2 Medidas de Proteção Implementadas

✅ **Minimização**: Coleta apenas dados necessários  
✅ **Hash de senha**: bcrypt com salt  
✅ **Não exposição**: Senhas nunca retornadas em respostas  
✅ **Consentimento**: Campo explícito em fidelidade  
✅ **Auditoria**: Logs de acesso a dados sensíveis  
✅ **Criptografia**: JWT para autenticação  
✅ **Ambiente seguro**: Variáveis sensíveis em .env (não versionado)

---

## 6. Pagamento Mock (Integração Externa)

### 6.1 Justificativa do Mock

Para fins de desenvolvimento e teste, foi implementado um **gateway de pagamento mock** que simula:

- **Aprovação** de pagamento (sucesso)
- **Recusa** de pagamento (falha)
- **Delay** simulado de processamento (800ms)
- **Geração** de ID de transação único

### 6.2 Cenários Suportados

| Cenário | Status Simulado | Uso |
|---------|-----------------|-----|
| **Sucesso** | `APROVADO` | Testar fluxo normal |
| **Falha** | `RECUSADO` | Testar tratamento de erro |

### 6.3 Integração Futura

O sistema está preparado para integração com gateways reais:
- Stripe
- Pagar.me
- MercadoPago
- PagSeguro

Basta substituir `paymentMockGateway` por implementação real.

---

## 7. Priorização e Justificativa Técnica do MVP

### 7.1 O que foi Implementado (MVP)

| Funcionalidade | Justificativa |
|----------------|---------------|
| **CRUD de Produtos** | Necessário para cardápio funcional |
| **Criação de Pedidos** | Core do negócio - sem isso não há sistema |
| **Validação de Estoque** | Evita vender produto sem estoque |
| **Pagamento Mock** | Permite testar fluxo completo sem integração real |
| **Multicanalidade** | Requisito explícito do domínio (rede de restaurantes) |
| **Autenticação JWT** | Segurança básica para API |
| **Autorização por Perfil** | Controle de acesso necessário (cliente vs gerente) |
| **LGPD Mínimo** | Conformidade legal obrigatória |
| **Logs de Auditoria** | Rastreabilidade de ações sensíveis |

### 7.2 O que NÃO foi Implementado (Planejado para Futuro)

| Funcionalidade | Motivo da Exclusão do MVP |
|----------------|---------------------------|
| **CRUD de Unidades** | Sistema focado em unidade única por enquanto |
| **Relatórios Avançados** | Pode ser feito via queries diretas no banco |
| **Notificações Push/Email** | Complexidade adicional não crítica |
| **Integração Pagamento Real** | Mock suficiente para validação |
| **Testes Automatizados** | Foco na funcionalidade primeiro |
| **Cache (Redis)** | SQLite suficiente para MVP |
| **Upload de Imagens** | Produtos podem ser criados sem imagem |

### 7.3 Justificativas Técnicas

**Por que Node.js + TypeScript?**
- Ecossistema maduro para APIs REST
- Tipagem estática reduz bugs
- Mesma linguagem no front e back (se necessário)

**Por que Prisma ORM?**
- Type-safe (integra com TypeScript)
- Migrations automáticas
- IntelliSense no VS Code
- Suporte a SQLite (dev) e PostgreSQL (prod)

**Por que SQLite (dev) / PostgreSQL (prod)?**
- SQLite: Zero configuração para desenvolvimento
- PostgreSQL: Robusto para produção (Render oferece free tier)

**Por que JWT?**
- Stateless (não precisa de sessão no servidor)
- Escalável (pode ter múltiplos servidores)
- Padrão de mercado

**Por que Zod para validação?**
- Type-safe (infere tipos TypeScript)
- Mensagens de erro claras
- Fácil de usar

---

## 8. Fluxo Principal (MVP Obrigatório)

### 8.1 Fluxo A: Pedido → Pagamento → Status
