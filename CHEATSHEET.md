# 🃏 Cheat Sheet — ระบบประเมินบุคลากร (ทบทวนก่อนแข่ง)

> **หัวใจ:** จำ helper ไม่กี่ตัว + โครงเดียว → copy เปลี่ยนชื่อ entity ใช้ได้ทั้งระบบ
> Stack: Express + MySQL + JWT(cookie) | Vue3 + Vuetify + Pinia + axios

---

## 📋 ลำดับการเขียนในห้องแข่ง (6 ชม.)
1. **Setup** → `package.json`, `.env`, `config/db.js`, `server.js`
2. **DB** → `schema.sql` (≥3 ตาราง) → seed admin
3. **Utils** → `utils/response.js`, `utils/handler.js` *(ฐานราก เขียนก่อน)*
4. **Middleware** → `auth.js`, `role.js`
5. **Auth module** → controller+route → **ทดสอบ login ให้ผ่านก่อน**
6. **โมดูลอื่น** → copy controller/route pattern ทีละตัว
7. **Frontend** → `main.js`, `router`, `store`, `lib/api`, `useCrud` → views

---

# 🔷 BACKEND

### 1) `utils/response.js` — จำ 4 ตัวนี้ (ใช้แทน res.json ทั้งระบบ)
```js
const ok       = (res, data=null, message='สำเร็จ')      => res.json({ status:'success', message, data })
const created  = (res, data=null, message='สร้างสำเร็จ') => res.status(201).json({ status:'success', message, data })
const fail     = (res, code=500, message='เกิดข้อผิดพลาด') => res.status(code).json({ status:'error', message, data:null })
const notFound = (res, message='ไม่พบข้อมูล')            => fail(res, 404, message)
module.exports = { ok, created, fail, notFound }
```

### 2) `utils/handler.js` — wrap (ตัด try/catch ทุก controller)
```js
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
```

### 3) `config/db.js` — pool + helper (one/many/run/update)
```js
const pool = require('mysql2/promise').createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME, charset: 'utf8mb4'
})
pool.one    = async (sql, p) => (await pool.query(sql, p))[0][0] || null     // 1 แถว/null
pool.many   = async (sql, p) => (await pool.query(sql, p))[0]                // array
pool.run    = async (sql, p) => (await pool.query(sql, p))[0]                // insertId/affectedRows
pool.update = async (table, data, where, wp=[]) => {                         // update เฉพาะ field ที่ส่ง
  const keys = Object.keys(data).filter(k => data[k] !== undefined)
  if (!keys.length) return { affectedRows: 0, noFields: true }
  const clause = keys.map(k => `${k}=?`).join(', ')
  return (await pool.query(`UPDATE ${table} SET ${clause} WHERE ${where}`, [...keys.map(k=>data[k]), ...wp]))[0]
}
module.exports = pool
```

### 4) Controller pattern — copy แล้วเปลี่ยนชื่อตาราง
```js
const db = require('../config/db')
const wrap = require('../utils/handler')
const { ok, created, fail, notFound } = require('../utils/response')

exports.getAll  = wrap(async (req, res) => ok(res, await db.many('SELECT * FROM items ORDER BY id DESC')))
exports.getById = wrap(async (req, res) => {
  const row = await db.one('SELECT * FROM items WHERE id=?', [req.params.id])
  if (!row) return notFound(res, 'ไม่พบ')
  ok(res, row)
})
exports.create  = wrap(async (req, res) => {
  const { name } = req.body
  const r = await db.run('INSERT INTO items (name) VALUES (?)', [name])
  created(res, { id: r.insertId })
})
exports.update  = wrap(async (req, res) => {
  const r = await db.update('items', req.body, 'id=?', [req.params.id])
  if (r.noFields)      return fail(res, 400, 'ไม่มีข้อมูลที่แก้ไข')
  if (!r.affectedRows) return notFound(res, 'ไม่พบ')
  ok(res, { id: req.params.id }, 'แก้ไขสำเร็จ')
})
exports.remove  = wrap(async (req, res) => {
  const r = await db.run('DELETE FROM items WHERE id=?', [req.params.id])
  if (!r.affectedRows) return notFound(res, 'ไม่พบ')
  ok(res, null, 'ลบสำเร็จ')
})
```

### 5) Route pattern (RESTful + auth + role)
```js
const router = require('express').Router()
const ctrl = require('../controllers/item.controller')
const auth = require('../middleware/auth')
const authorize = require('../middleware/role')
router.get   ('/',    auth, ctrl.getAll)
router.get   ('/:id', auth, ctrl.getById)
router.post  ('/',    auth, authorize('hr'), ctrl.create)   // เฉพาะ HR
router.put   ('/:id', auth, authorize('hr'), ctrl.update)
router.delete('/:id', auth, authorize('hr'), ctrl.remove)
module.exports = router
// ⚠️ route เฉพาะ (/period/:x) ต้องอยู่ "ก่อน" /:id เสมอ
```

### 6) Middleware
```js
// auth.js — อ่าน JWT จาก cookie
const jwt = require('jsonwebtoken')
module.exports = (req, res, next) => {
  try { req.user = jwt.verify(req.cookies?.token, process.env.JWT_SECRET); next() }
  catch { res.status(401).json({ status:'error', message:'กรุณาเข้าสู่ระบบ', data:null }) }
}
// role.js — ตรวจสิทธิ์
module.exports = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next()
    : res.status(403).json({ status:'error', message:'ไม่มีสิทธิ์', data:null })
```

### 7) Login (JWT signing + httpOnly cookie)
```js
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken')
exports.login = wrap(async (req, res) => {
  const { username, password } = req.body
  const user = await db.one('SELECT * FROM users WHERE username=?', [username])
  if (!user || !(await bcrypt.compare(password, user.password)))
    return fail(res, 401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
  const token = jwt.sign({ id:user.id, role:user.role }, process.env.JWT_SECRET, { expiresIn:'24h' })
  res.cookie('token', token, { httpOnly:true, sameSite:'lax', maxAge:86400000 })
  ok(res, { id:user.id, role:user.role, full_name:user.full_name }, 'เข้าสู่ระบบสำเร็จ')
})
// register: hash = await bcrypt.hash(password, 10) ก่อน INSERT
```

### 8) `server.js` (ตัวจบ — error handler ใช้ fail)
```js
require('dotenv').config()
const express = require('express'), cors = require('cors'), cookieParser = require('cookie-parser')
const { fail } = require('./utils/response')
const app = express()
app.use(cors({ origin:'http://localhost:5173', credentials:true }))
app.use(express.json()); app.use(cookieParser())
app.use('/api/auth', require('./routes/auth.routes'))      // ...routes อื่น
app.get('/api/health', (req,res) => res.json({ status:'success', message:'ok', data:null }))
app.use((err, req, res, next) => { console.error(err); fail(res, err.status||500, 'เกิดข้อผิดพลาด') })  // error กลาง
app.use((req, res) => fail(res, 404, `ไม่พบ Route: ${req.originalUrl}`))                                  // 404
app.listen(process.env.PORT || 3000, () => console.log('🚀 running'))
```

### 9) Upload (multer) + PDF (pdfkit)
```js
// route: const upload = multer({ storage, fileFilter, limits:{fileSize:10*1024*1024} })
//        router.post('/', auth, upload.single('file'), ctrl.uploadFile)
// controller: if (!req.file) return fail(res,400,'เลือกไฟล์'); ...INSERT uploaded_files
// PDF: const doc = new PDFDocument(); doc.font('C:/Windows/Fonts/tahoma.ttf')  // ฟอนต์ไทย!
//      res.setHeader('Content-Type','application/pdf'); doc.pipe(res); doc.text(...); doc.end()
```

---

# 🔶 FRONTEND

### 1) `lib/api.js` — axios instance กลาง
```js
import axios from 'axios'
export const api = axios.create({ baseURL:'/api', withCredentials:true })  // ส่ง cookie อัตโนมัติ
```
```js
// vite.config.js — proxy /api ไป backend
server: { proxy: { '/api': 'http://localhost:3000' } }
```

### 2) `composables/useCrud.js` — ตัวลด code มากสุด (จำโครงนี้)
```js
import { ref, reactive, inject } from 'vue'
import { api } from '../lib/api'
export const useCrud = (endpoint, blank = {}) => {
  const notify = inject('showSnackbar')
  const items = ref([]), loading = ref(false), saving = ref(false)
  const dialog = ref(false), editId = ref(null), form = reactive({ ...blank })
  const isEdit = () => editId.value !== null
  const load = async (q='') => { loading.value=true
    try { items.value = (await api.get(endpoint+q)).data.data || [] } finally { loading.value=false } }
  const openCreate = (p={}) => { editId.value=null; Object.assign(form, blank, p); dialog.value=true }
  const openEdit   = (row)  => { editId.value=row.id; Object.assign(form, blank, row); dialog.value=true }
  const save = async (formRef) => {
    if (formRef && !(await formRef.validate()).valid) return false
    saving.value=true
    try {
      if (isEdit()) await api.put(`${endpoint}/${editId.value}`, form)
      else          await api.post(endpoint, form)
      dialog.value=false; notify?.(isEdit()?'แก้ไขสำเร็จ':'บันทึกสำเร็จ'); await load(); return true
    } catch(e){ notify?.(e.response?.data?.message||'ผิดพลาด','error'); return false }
    finally { saving.value=false }
  }
  const remove = async (id) => { await api.delete(`${endpoint}/${id}`); notify?.('ลบสำเร็จ'); await load() }
  return { items, loading, saving, dialog, editId, form, isEdit, load, openCreate, openEdit, save, remove }
}
```

### 3) View CRUD pattern — copy ทุกหน้าจัดการข้อมูล
```vue
<template>
  <v-btn @click="openCreate()">เพิ่ม</v-btn>
  <v-table><tbody>
    <tr v-for="x in items" :key="x.id">
      <td>{{ x.title }}</td>
      <td>
        <v-btn icon="mdi-pencil" @click="openEdit(x)" />
        <v-btn icon="mdi-delete" @click="remove(x.id)" />
      </td>
    </tr>
  </tbody></v-table>

  <v-dialog v-model="dialog" max-width="500">
    <v-card class="pa-6">
      <v-card-title>{{ isEdit() ? 'แก้ไข' : 'เพิ่ม' }}</v-card-title>
      <v-form @submit.prevent="save(formRef)" ref="formRef">
        <v-text-field v-model="form.title" label="ชื่อ *" :rules="[req]" />
        <v-btn type="submit" :loading="saving">บันทึก</v-btn>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useCrud } from '../composables/useCrud'
const req = v => !!v || 'กรุณากรอก'
const { items, saving, dialog, form, isEdit, load, openCreate, openEdit, save, remove } =
  useCrud('/items', { title: '' })
const formRef = ref(null)
load()
</script>
```

### 4) Pinia auth store + snackbar (App.vue)
```js
// stores/auth.js
import { defineStore } from 'pinia'
import { api } from '../lib/api'
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: JSON.parse(localStorage.getItem('user')) || null }),
  getters: { isHR: s => s.user?.role==='hr', isAuthenticated: s => !!s.user },
  actions: {
    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password })
      this.user = data.data; localStorage.setItem('user', JSON.stringify(data.data))
    },
    async logout(){ await api.post('/auth/logout'); this.user=null; localStorage.removeItem('user') }
  }
})
```
```vue
<!-- App.vue: provide snackbar ให้ทั้งแอป -->
<script setup>
import { ref, provide } from 'vue'
const snackbar = ref({ show:false, text:'', color:'success' })
provide('showSnackbar', (text, color='success') => { snackbar.value = { show:true, text, color } })
</script>
```

### 5) Router guard
```js
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
  if (to.meta.role && auth.user?.role !== to.meta.role) return '/'
})
```

---

# 🧪 TEST (เกณฑ์ส่วน 7) — `node --test`
```js
const { test } = require('node:test'), assert = require('node:assert')
const { calcWeightedAverage } = require('../utils/score')
test('คำนวณคะแนนถ่วงน้ำหนัก', () => {
  assert.strictEqual(calcWeightedAverage([{score:4,weight:2},{score:2,weight:1}]), '3.33')
})
// package.json → "test": "node --test"   (ห้ามใช้ glob — Windows cmd ไม่ขยาย *)
```

---

# ✅ CHECKLIST เกณฑ์ 100 คะแนน
| # | ส่วน | คะแนน | ของในระบบนี้ |
|---|------|------|--------------|
| 1 | Flow diagram | 5 | (วาดในห้องแข่ง) |
| 2 | ER diagram | 5 | 10 ตาราง |
| 3 | หน้าจอ template | 5 | (mockup) |
| 4 | RESTful API | 5 | method+endpoint สื่อความหมาย, response มี status/message/data |
| 5 | พัฒนาโปรแกรม | **30** | HR(14)/ผู้รับ(8)/กรรมการ(8) |
| 6 | Backend API | **10** | GET param, POST body, upload, JWT, exception, แยกไฟล์ |
| 7 | ทดสอบ | **10** | unit test, login ถูก/ผิด, insert, update, validate |
| 8 | โจทย์พิเศษ | **20** | แสดง(2) ตรวจ(2) **upload(5)** backup/restore(2) **report(3)** อื่น(6) |
| 9 | นำเสนอ | **10** | ตอบคำถาม, บุคลิกภาพ, ใน 10 นาที |

**🎖️ เหรียญ:** ทอง ≥80 · เงิน 70-79 · ทองแดง 60-69

---
### 💡 กับดักที่เจอบ่อย (อย่าพลาด!)
- **Route order:** `/:id` ต้องอยู่ท้ายสุด (ไม่งั้นชน `/period/:x`)
- **PDF ภาษาไทย:** ต้อง `doc.font('ttf ฟอนต์ไทย')` ก่อน ไม่งั้นเป็นกล่อง □□□
- **mysql2:** ค่า `undefined` ใส่ params ไม่ได้ → ใช้ `null`
- **CORS:** ต้อง `credentials:true` ทั้ง backend + axios `withCredentials:true` (ไม่งั้น cookie ไม่ไป)
- **Validation:** `body('x').notEmpty()` + middleware `validate` เช็ค `validationResult(req)`
