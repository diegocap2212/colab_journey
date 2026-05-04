import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'otmow.db');

console.log('🚀 Iniciando configuração do Banco de Dados...');

if (!fs.existsSync(DB_DIR)) {
  console.log('📁 Criando diretório de dados...');
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('🏗️ Criando tabelas...');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    job_title TEXT DEFAULT '',
    job_level TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    profile_picture TEXT DEFAULT '',
    verification_code TEXT,
    code_expiry TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engineer_email TEXT NOT NULL,
    engineer_name TEXT NOT NULL,
    evaluator_email TEXT NOT NULL,
    evaluator_name TEXT NOT NULL,
    cycle TEXT NOT NULL,
    execution_score INTEGER,
    execution_text TEXT,
    communication_score INTEGER,
    communication_text TEXT,
    dev_score INTEGER,
    dev_text TEXT,
    maintain_score INTEGER,
    maintain_text TEXT,
    study_score INTEGER,
    study_text TEXT,
    ownership_score INTEGER,
    ownership_text TEXT,
    cultural_score INTEGER,
    cultural_text TEXT,
    general_text TEXT,
    is_draft INTEGER DEFAULT 1,
    is_anonymous INTEGER DEFAULT 0,
    email_sent INTEGER DEFAULT 0,
    is_read INTEGER DEFAULT 0,
    impacts_json TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS competency_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS competency_matrix_defs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    support_docs TEXT DEFAULT '',
    target_score INTEGER NOT NULL DEFAULT 2,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS competency_user_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_id INTEGER NOT NULL,
    user_email TEXT NOT NULL,
    competency_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    last_updated TEXT DEFAULT (datetime('now')),
    UNIQUE(cycle_id, user_email, competency_id),
    FOREIGN KEY(cycle_id) REFERENCES competency_cycles(id),
    FOREIGN KEY(competency_id) REFERENCES competency_matrix_defs(id)
  );
`);

async function seed() {
  console.log('🌱 Semeando dados iniciais...');

  // 1. Admin User
  const adminEmail = 'diegocaporusso@gmail.com';
  const password = 'admin'; // Senha padrão para o primeiro acesso
  const hash = await bcrypt.hash(password, 12);

  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    db.prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)').run(
      adminEmail,
      'Diego Caporusso',
      hash,
      'admin'
    );
    console.log(`✅ Admin criado: ${adminEmail} (senha: ${password})`);
  } else {
    console.log('ℹ️ Admin já existe.');
  }

  // 2. Demo Cycle
  const existingCycle = db.prepare('SELECT id FROM competency_cycles WHERE is_active = 1').get();
  if (!existingCycle) {
    db.prepare('INSERT INTO competency_cycles (name, is_active) VALUES (?, ?)').run('Ciclo Q2 2026', 1);
    console.log('✅ Ciclo inicial criado.');
  }

  // 3. Competency Matrix
  const defCount = db.prepare('SELECT COUNT(*) as count FROM competency_matrix_defs').get().count;
  if (defCount === 0) {
    const defs = [
      { category: 'Execução', sub_category: 'Entrega de tarefas no prazo', target_score: 2, order_index: 0 },
      { category: 'Execução', sub_category: 'Qualidade do código entregue', target_score: 2, order_index: 1 },
      { category: 'Comunicação', sub_category: 'Clareza em dailies e rituais', target_score: 2, order_index: 2 },
      { category: 'Desenvolvimento', sub_category: 'Revisão de código (PR reviews)', target_score: 2, order_index: 3 },
      { category: 'Ownership', sub_category: 'Responsabilidade por resultados', target_score: 2, order_index: 4 },
      { category: 'Cultura', sub_category: 'Colaboração com o time', target_score: 2, order_index: 5 },
    ];
    const insert = db.prepare('INSERT INTO competency_matrix_defs (category, sub_category, target_score, order_index) VALUES (?, ?, ?, ?)');
    for (const d of defs) {
      insert.run(d.category, d.sub_category, d.target_score, d.order_index);
    }
    console.log('✅ Matriz de competências populada.');
  }

  console.log('✨ Configuração concluída com sucesso!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erro no setup:', err);
  process.exit(1);
});
