const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. ROUTE: Detail Satu Pemain (By ID)
// ==========================================
app.get("/api/admin/players/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // PERBAIKAN: Mengubah 'last_day' menjadi 'last_played_day' sesuai database
    const result = await pool.query(
      `
      SELECT 
        u.id, 
        u.username, 
        u.role, 
        u.created_at,
        gp.last_played_day as "lastPlayedDay", 
        gp.total_knowledge as "totalKnowledge", 
        gp.total_compliance as "totalCompliance", 
        gp.final_hb as "finalHb", 
        gp.is_completed
      FROM users u
      LEFT JOIN game_progress gp ON u.id = gp.user_id
      WHERE u.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pemain tidak ditemukan" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error Detail Pemain:", err.message);
    res.status(500).json({ error: "Server error saat mengambil detail" });
  }
});

// ==========================================
// 2. ROUTE: List Semua Pemain (Dashboard)
// ==========================================
app.get("/api/admin/players", async (req, res) => {
  try {
    const query = `
            SELECT 
                   u.id, 
                   u.username, 
                   u.created_at,
                   COALESCE(g.total_knowledge, 0) as "totalKnowledge",
                   COALESCE(g.total_compliance, 0) as "totalCompliance",
                   g.final_hb as "finalHb",
                   g.last_played_day as "lastPlayedDay",
                   g.is_completed
            FROM users u
            LEFT JOIN game_progress g ON u.id = g.user_id
            WHERE u.role = 'student'
            ORDER BY g.updated_at DESC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- JALUR KHUSUS LOGIN ADMIN (Tidak mengganggu siswa) ---
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Hanya mencari user yang username, password, DAN role-nya 'admin'
    const result = await pool.query(
      "SELECT id, username, role FROM users WHERE username = $1 AND password = $2 AND role = 'admin'",
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res
        .status(401)
        .json({ success: false, error: "Username atau Password Salah!" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================================
// 3. ROUTE: Login / Register Siswa
// ==========================================
app.post("/api/login", async (req, res) => {
  const { username, character } = req.body;
  try {
    const checkUser = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    let user;
    if (checkUser.rows.length > 0) {
      user = checkUser.rows[0];
    } else {
      const newUser = await pool.query(
        "INSERT INTO users (username, password, role) VALUES ($1, '123', 'student') RETURNING *",
        [username]
      );
      user = newUser.rows[0];
    }
    res.json({
      success: true,
      user: { id: user.id, username: user.username, character: character },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

// ==========================================
// 4. ROUTE: Simpan Progress Game
// ==========================================
app.post("/api/save-progress", async (req, res) => {
  const {
    userId,
    totalKnowledge,
    totalCompliance,
    finalHb,
    lastDay,
    isCompleted,
  } = req.body;
  try {
    const checkProgress = await pool.query(
      "SELECT * FROM game_progress WHERE user_id = $1",
      [userId]
    );
    if (checkProgress.rows.length > 0) {
      const sql = `
                UPDATE game_progress 
                SET total_knowledge = $1, total_compliance = $2, final_hb = $3, last_played_day = $4, is_completed = $5, updated_at = NOW()
                WHERE user_id = $6
            `;
      await pool.query(sql, [
        totalKnowledge,
        totalCompliance,
        finalHb,
        lastDay,
        isCompleted,
        userId,
      ]);
    } else {
      const sql = `
                INSERT INTO game_progress (user_id, total_knowledge, total_compliance, final_hb, last_played_day, is_completed)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
      await pool.query(sql, [
        userId,
        totalKnowledge,
        totalCompliance,
        finalHb,
        lastDay,
        isCompleted,
      ]);
    }
    res.json({
      success: true,
      message: "Progress berhasil disimpan ke Cloud!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// --- 5. ROUTE: Hapus Data Pemain Berdasarkan ID ---
// ==========================================
app.delete("/api/admin/players/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Hapus dulu data di tabel game_progress (karena ada foreign key)
    await pool.query("DELETE FROM game_progress WHERE user_id = $1", [id]);

    // 2. Kemudian hapus data di tabel users
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pemain tidak ditemukan" });
    }

    res.json({ success: true, message: "Data pemain berhasil dihapus" });
  } catch (err) {
    console.error("Error Hapus Pemain:", err.message);
    res.status(500).json({ error: "Server error saat menghapus data" });
  }
});

// ==========================================
// --- 6. ROUTE: Hapus Seluruh Data Pemain (Reset Database) ---
// ==========================================
app.delete("/api/admin/reset-all", async (req, res) => {
  try {
    // Menghapus semua isi tabel progress dan users (role student)
    await pool.query("DELETE FROM game_progress");
    await pool.query("DELETE FROM users WHERE role = 'student'");

    res.json({
      success: true,
      message: "Seluruh data pemain berhasil direset",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mereset database" });
  }
});

// Jalankan Server (Hanya jika dijalankan lokal/Laragon)
if (process.env.NODE_ENV !== "production") {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app; // PENTING: Harus diekspor agar terbaca oleh Vercel
