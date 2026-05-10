# Congregação Nova Limoeiro — Sistema de Presenças

## Estrutura do projeto

```
nova-limoeiro/
├── src/
│   ├── components/
│   │   ├── AuthProvider.jsx   ← controla login/logout
│   │   ├── AppLayout.jsx      ← layout com sidebar responsiva
│   │   └── Sidebar.jsx        ← navegação lateral
│   ├── pages/
│   │   ├── Login.jsx          ← tela de login com senha
│   │   ├── Dashboard.jsx      ← /dashboard
│   │   ├── Assistencia.jsx    ← /assistencia  (planilha)
│   │   ├── Membros.jsx        ← /membros
│   │   └── Eventos.jsx        ← /eventos
│   ├── lib/
│   │   ├── supabase.js        ← cliente do banco de dados
│   │   └── data.js            ← grupos, membros, funções utilitárias
│   ├── App.jsx                ← rotas
│   ├── main.jsx
│   └── index.css
├── supabase/
│   └── schema.sql             ← SQL para criar tabelas e políticas
├── .env.example               ← modelo de variáveis de ambiente
├── vercel.json                ← configuração para deploy
└── package.json
```

---

## Passo a passo para colocar no ar

### 1. Criar conta no Supabase (banco de dados)

1. Acesse **supabase.com** e crie uma conta gratuita
2. Clique em **New Project** — escolha um nome (ex: `nova-limoeiro`) e uma senha forte
3. Aguarde o projeto ser criado (~2 minutos)
4. Vá em **Settings → API** e copie:
   - `Project URL` → é o `VITE_SUPABASE_URL`
   - `anon public` key → é o `VITE_SUPABASE_ANON_KEY`

### 2. Criar as tabelas no Supabase

1. No painel do Supabase, clique em **SQL Editor**
2. Cole o conteúdo de `supabase/schema.sql` e clique **Run**
3. As tabelas `attendance` e `events` serão criadas com segurança ativada

### 3. Criar o usuário administrador

1. No Supabase, vá em **Authentication → Users → Add user**
2. Crie com o e-mail e senha que quiser (ex: `admin@novalimoeiro.com.br`)
3. Você pode criar usuários adicionais para líderes de grupo

### 4. Publicar no Vercel

1. Crie uma conta gratuita em **vercel.com**
2. Instale o Vercel CLI: `npm install -g vercel`
3. Na pasta do projeto, execute:
   ```bash
   npm install
   vercel
   ```
4. Durante o setup, quando perguntar sobre variáveis de ambiente, adicione:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua anon key

   Ou adicione pelo painel: **Vercel → Project → Settings → Environment Variables**

5. Para atualizar depois, basta rodar `vercel --prod`

### 5. Conectar o domínio (após registrar no Registro.br)

1. No painel do Vercel, vá em **Settings → Domains**
2. Adicione `novalimoeiro.com.br` e `www.novalimoeiro.com.br`
3. O Vercel vai mostrar os registros DNS para configurar
4. No **Registro.br**, vá em **DNS** do seu domínio e adicione:
   - Tipo `A` apontando para o IP do Vercel (ex: `76.76.21.21`)
   - Tipo `CNAME` de `www` para `cname.vercel-dns.com`
5. Aguarde até 48h para propagar (geralmente menos de 1h)

### 6. URLs do sistema

Após o domínio estar ativo:

| Página       | URL                                        |
|--------------|--------------------------------------------|
| Login        | `novalimoeiro.com.br/login`                |
| Dashboard    | `novalimoeiro.com.br/dashboard`            |
| Planilha     | `novalimoeiro.com.br/assistencia`          |
| Membros      | `novalimoeiro.com.br/membros`              |
| Eventos      | `novalimoeiro.com.br/eventos`              |

---






## Desenvolvimento local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e preencher variáveis
cp .env.example .env
# edite .env com seus dados do Supabase

# 3. Rodar localmente
npm run dev
# Acesse: http://localhost:5173
```

---

## Notas importantes

- Os **dados dos membros** estão em `src/lib/data.js`. Para adicionar ou remover membros, edite esse arquivo e faça novo deploy.
- As **presenças e eventos** ficam salvos no Supabase e persistem entre sessões.
- O sistema funciona bem em **celular, tablet e notebook** — sidebar vira menu hambúrguer no mobile.
- O plano gratuito do Supabase suporta bem o volume de dados da congregação.
