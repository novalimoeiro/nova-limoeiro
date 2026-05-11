-- ============================================================
-- Tabela de membros (adicione ao schema.sql ou rode separado)
-- ============================================================

CREATE TABLE IF NOT EXISTS members (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  group_name TEXT        NOT NULL,
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_group  ON members(group_name);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(active);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler membros"
  ON members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem gerenciar membros"
  ON members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Seed: 85 membros
-- ============================================================

INSERT INTO members (id, name, group_name, active) VALUES
(1, 'Almir Teixeira', 'Agave', true),
(2, 'Celso Freitas', 'Agave', true),
(3, 'Creuza Teixeira', 'Agave', true),
(4, 'Cristiane Teixeira', 'Agave', true),
(5, 'Eliane Arruda', 'Agave', true),
(6, 'Fernanda Gonçalves', 'Agave', true),
(7, 'Genildo Santana', 'Agave', true),
(8, 'Janaine Freitas', 'Agave', true),
(9, 'Levi Arruda', 'Agave', true),
(10, 'Melissa Mendonça', 'Agave', true),
(11, 'Mônica Gimenez', 'Agave', true),
(12, 'Rafael Teixeira', 'Agave', true),
(13, 'Rafaela Gimenez', 'Agave', true),
(14, 'Rosemeire Pereira', 'Agave', true),
(15, 'Vania Bento', 'Agave', true),
(16, 'Vilma Vieira', 'Agave', true),
(17, 'Weslley Mendonça', 'Agave', true),
(18, 'Aline Arruda', 'Augusto Antunes', true),
(19, 'Aline Barros', 'Augusto Antunes', true),
(20, 'Anderson Magalhães', 'Augusto Antunes', true),
(21, 'Carolina S. Oliveira', 'Augusto Antunes', true),
(22, 'Edinei Rodrigues', 'Augusto Antunes', true),
(23, 'Enzo Magalhães', 'Augusto Antunes', true),
(24, 'Ewerton Arruda', 'Augusto Antunes', true),
(25, 'Helen Magalhães', 'Augusto Antunes', true),
(26, 'Ingrid Romero', 'Augusto Antunes', true),
(27, 'Jacqueline Ramos', 'Augusto Antunes', true),
(28, 'Kelvyn Martins de Morais', 'Augusto Antunes', true),
(29, 'Luiza Rodrigues', 'Augusto Antunes', true),
(30, 'Neri Martins de Arruda', 'Augusto Antunes', true),
(31, 'Raphael Martinez', 'Augusto Antunes', true),
(32, 'Roberta Martinez', 'Augusto Antunes', true),
(33, 'Vanira Oliveira', 'Augusto Antunes', true),
(34, 'Amanda Nascimento', 'Coronel Alves', true),
(35, 'Djalma Andrade', 'Coronel Alves', true),
(36, 'Djalson Parmezan', 'Coronel Alves', true),
(37, 'Ideir Bastos', 'Coronel Alves', true),
(38, 'Jhonatas N. Nascimento', 'Coronel Alves', true),
(39, 'José Manoel de Oliveira', 'Coronel Alves', true),
(40, 'Juscelino Nascimento', 'Coronel Alves', true),
(41, 'Larissa Almeida', 'Coronel Alves', true),
(42, 'Luanda Almeida', 'Coronel Alves', true),
(43, 'Maria do Carmo', 'Coronel Alves', true),
(44, 'Maria de Lourdes', 'Coronel Alves', true),
(45, 'Maria Luziene', 'Coronel Alves', true),
(46, 'Maria Rosa Venturim', 'Coronel Alves', true),
(47, 'Rosalia Motta', 'Coronel Alves', true),
(48, 'Rosângela da Silva', 'Coronel Alves', true),
(49, 'Sonia Parmezan', 'Coronel Alves', true),
(50, 'Sueli Andrade', 'Coronel Alves', true),
(51, 'Aline Mitter', 'Floco de Neve', true),
(52, 'Beatriz Ferreira', 'Floco de Neve', true),
(53, 'Daniel Ferreira', 'Floco de Neve', true),
(54, 'Helena Mitter', 'Floco de Neve', true),
(55, 'Henrique Mitter', 'Floco de Neve', true),
(56, 'José Cristino', 'Floco de Neve', true),
(57, 'Jose Ferreira', 'Floco de Neve', true),
(58, 'Josenilton Silva', 'Floco de Neve', true),
(59, 'Luan Teixeira', 'Floco de Neve', true),
(60, 'Marcos Butkeraites', 'Floco de Neve', true),
(61, 'Maria Rosendo', 'Floco de Neve', true),
(62, 'Mayara Mitter', 'Floco de Neve', true),
(63, 'Rosilene Barbosa', 'Floco de Neve', true),
(64, 'Santa Duarte', 'Floco de Neve', true),
(65, 'Samuel Araujo', 'Floco de Neve', true),
(66, 'Thelis Barbosa', 'Floco de Neve', true),
(67, 'Zinilda Butkeraites', 'Floco de Neve', true),
(68, 'Andreia Belli', 'Rock Estrela', true),
(69, 'Augusto Bernardes', 'Rock Estrela', true),
(70, 'Divaldina Santos', 'Rock Estrela', true),
(71, 'Emerson Belli', 'Rock Estrela', true),
(72, 'Eric Butkeraites', 'Rock Estrela', true),
(73, 'Gabriel Santos', 'Rock Estrela', true),
(74, 'Isac Santos', 'Rock Estrela', true),
(75, 'Ivoneide Santos', 'Rock Estrela', true),
(76, 'Lucilia Sebastião', 'Rock Estrela', true),
(77, 'Maria Madalena', 'Rock Estrela', true),
(78, 'Maria das Graças', 'Rock Estrela', true),
(79, 'Maria Luiza Alencar', 'Rock Estrela', true),
(80, 'Marizete Santos', 'Rock Estrela', true),
(81, 'Solange Boemer', 'Rock Estrela', true),
(82, 'Sueli Nascimento', 'Rock Estrela', true),
(83, 'Tânia Franco Pereira', 'Rock Estrela', true),
(84, 'Tatiane Alencar', 'Rock Estrela', true),
(85, 'Thamires Butkeraites', 'Rock Estrela', true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      group_name = EXCLUDED.group_name,
      active = EXCLUDED.active;

-- Resetar sequence para próximo ID ficar correto
SELECT setval('members_id_seq', (SELECT MAX(id) FROM members));
