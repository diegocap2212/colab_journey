import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'otmow.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initDb(_db);
  }
  return _db;
}

function initDb(db: Database.Database) {
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
      -- Dimensões
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
      -- Metadados
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

    CREATE TABLE IF NOT EXISTS competency_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cycle_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      submitted_at TEXT DEFAULT (datetime('now')),
      UNIQUE(cycle_id, user_email)
    );

    CREATE TABLE IF NOT EXISTS pdps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      engineer_email TEXT NOT NULL,
      feedback_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      competency_area TEXT,
      target_date TEXT,
      status TEXT DEFAULT 'active',
      progress INTEGER DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vacations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      manager_email TEXT NOT NULL,
      days INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed admin users
  const adminEmails = ['luiz@otmow.com', 'diegocaporusso@gmail.com'];
  for (const email of adminEmails) {
    const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (!exists) {
      db.prepare("INSERT OR IGNORE INTO users (email, name, role) VALUES (?, ?, 'admin')").run(
        email, 
        email.split('@')[0], 
        'admin'
      );
    }
  }

  // Seed initial cycle
  const cycle = db.prepare("SELECT id FROM competency_cycles WHERE is_active = 1").get();
  if (!cycle) {
    db.prepare("INSERT INTO competency_cycles (name, is_active) VALUES ('Ciclo Inicial', 1)").run();
  }

  // Seed competency matrix
  const defCount = db.prepare("SELECT COUNT(*) as count FROM competency_matrix_defs").get() as { count: number };
  if (defCount.count === 0) {
    const defs = [
      { category: 'Execução', sub_category: 'Entrega de tarefas no prazo', target_score: 2, order_index: 0 },
      { category: 'Execução', sub_category: 'Qualidade do código entregue', target_score: 2, order_index: 1 },
      { category: 'Execução', sub_category: 'Resolução de bloqueios', target_score: 2, order_index: 2 },
      { category: 'Comunicação', sub_category: 'Clareza em dailies e rituais', target_score: 2, order_index: 3 },
      { category: 'Comunicação', sub_category: 'Documentação de decisões', target_score: 1, order_index: 4 },
      { category: 'Comunicação', sub_category: 'Proatividade em reports', target_score: 2, order_index: 5 },
      { category: 'Desenvolvimento', sub_category: 'Revisão de código (PR reviews)', target_score: 2, order_index: 6 },
      { category: 'Desenvolvimento', sub_category: 'Boas práticas e padrões', target_score: 2, order_index: 7 },
      { category: 'Desenvolvimento', sub_category: 'Testes e cobertura', target_score: 1, order_index: 8 },
      { category: 'Manutenção', sub_category: 'Monitoramento e alertas', target_score: 1, order_index: 9 },
      { category: 'Manutenção', sub_category: 'Gestão de débito técnico', target_score: 2, order_index: 10 },
      { category: 'Estudo', sub_category: 'Aprendizado contínuo', target_score: 2, order_index: 11 },
      { category: 'Estudo', sub_category: 'Compartilhamento de conhecimento', target_score: 1, order_index: 12 },
      { category: 'Ownership', sub_category: 'Responsabilidade por resultados', target_score: 2, order_index: 13 },
      { category: 'Ownership', sub_category: 'Iniciativa sem precisar de direcionamento', target_score: 2, order_index: 14 },
      { category: 'Cultura', sub_category: 'Colaboração com o time', target_score: 2, order_index: 15 },
      { category: 'Cultura', sub_category: 'Aderência aos valores da empresa', target_score: 2, order_index: 16 },
    ];
    const insert = db.prepare("INSERT INTO competency_matrix_defs (category, sub_category, target_score, order_index) VALUES (?, ?, ?, ?)");
    for (const d of defs) {
      insert.run(d.category, d.sub_category, d.target_score, d.order_index);
    }
  }
}
