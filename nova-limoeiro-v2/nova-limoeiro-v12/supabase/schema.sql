-- ============================================================
-- Congregação Nova Limoeiro — Schema do banco de dados
-- Execute este SQL no painel do Supabase: SQL Editor
-- ============================================================

-- Tabela de presenças
CREATE TABLE IF NOT EXISTS attendance (
  id         BIGSERIAL PRIMARY KEY,
  member_id  INTEGER     NOT NULL,
  date       DATE        NOT NULL,
  status     CHAR(1)     NOT NULL CHECK (status IN ('P','Z','A','E')),
  year       INTEGER     NOT NULL DEFAULT 2026,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id, date)
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS events (
  id         BIGSERIAL PRIMARY KEY,
  date       DATE        NOT NULL UNIQUE,
  event_type VARCHAR(2)  NOT NULL,
  year       INTEGER     NOT NULL DEFAULT 2026,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_attendance_date   ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_year   ON attendance(year);
CREATE INDEX IF NOT EXISTS idx_events_year       ON events(year);

-- Row Level Security (RLS) — só usuários autenticados podem acessar
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE events     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler presenças"
  ON attendance FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem salvar presenças"
  ON attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Autenticados podem ler eventos"
  ON events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem salvar eventos"
  ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- DADOS HISTÓRICOS: Presenças Jan–Mai 2026
-- Execute após criar as tabelas
-- ============================================================

INSERT INTO attendance (member_id, date, status, year) VALUES
(1,'2026-01-01','Z',2026),(1,'2026-01-04','P',2026),(1,'2026-01-11','P',2026),(1,'2026-01-15','P',2026),(1,'2026-01-18','P',2026),(1,'2026-01-22','P',2026),(1,'2026-01-25','P',2026),(1,'2026-01-29','P',2026),
(1,'2026-02-01','Z',2026),(1,'2026-02-05','P',2026),(1,'2026-02-08','P',2026),(1,'2026-02-12','P',2026),(1,'2026-02-15','P',2026),(1,'2026-02-19','P',2026),(1,'2026-02-21','P',2026),(1,'2026-02-26','P',2026),
(1,'2026-03-01','P',2026),(1,'2026-03-05','P',2026),(1,'2026-03-08','P',2026),(1,'2026-03-12','P',2026),(1,'2026-03-15','P',2026),(1,'2026-03-19','Z',2026),(1,'2026-03-22','Z',2026),(1,'2026-03-26','Z',2026),(1,'2026-03-29','P',2026),
(1,'2026-04-09','P',2026),(1,'2026-04-12','P',2026),(1,'2026-04-16','P',2026),(1,'2026-04-19','P',2026),(1,'2026-04-23','P',2026),(1,'2026-04-26','P',2026),(1,'2026-04-30','P',2026),
(1,'2026-05-07','P',2026),
(2,'2026-01-01','P',2026),(2,'2026-01-04','P',2026),(2,'2026-01-11','P',2026),(2,'2026-01-15','P',2026),(2,'2026-01-18','P',2026),(2,'2026-01-22','P',2026),(2,'2026-01-25','P',2026),(2,'2026-01-29','P',2026),
(2,'2026-02-01','Z',2026),(2,'2026-02-05','P',2026),(2,'2026-02-08','P',2026),(2,'2026-02-12','P',2026),(2,'2026-02-15','P',2026),(2,'2026-02-19','P',2026),(2,'2026-02-21','P',2026),(2,'2026-02-26','P',2026),
(2,'2026-03-01','P',2026),(2,'2026-03-05','P',2026),(2,'2026-03-08','P',2026),(2,'2026-03-12','P',2026),(2,'2026-03-15','P',2026),(2,'2026-03-19','P',2026),(2,'2026-03-22','P',2026),(2,'2026-03-26','P',2026),(2,'2026-03-29','P',2026),
(2,'2026-04-09','P',2026),(2,'2026-04-12','P',2026),(2,'2026-04-16','P',2026),(2,'2026-04-19','P',2026),(2,'2026-04-23','P',2026),(2,'2026-04-26','P',2026),(2,'2026-04-30','P',2026),
(2,'2026-05-07','P',2026)
ON CONFLICT (member_id, date) DO NOTHING;

-- NOTA: O SQL completo com todos os 85 membros está no arquivo
-- supabase/seed_full.sql para não tornar este arquivo muito grande.
-- Você pode importar os dados históricos pelo painel do Supabase
-- ou executar o seed separado.
