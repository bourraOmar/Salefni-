# 💳 Credit Simulator App

## 🧱 Description

Web app built with **React** (frontend) and **json-server** (mock backend) to simulate and manage credit requests.
Guests can simulate loans and submit applications; admins can view, filter, and manage requests.

---

## ⚙️ Architecture

**Frontend**: React + Vite, React Router, Tailwind CSS, Axios, Zustand/Context.
**Backend**: json-server for CRUD (simulations, applications, notifications).

**Main Pages**

* **Guest**: Simulator, Credit Request Form
* **Admin**: Dashboard, Request Details, Notes, Status Update, Export CSV

---

## 🧩 Installation

```bash
git clone <repo-url>
cd frontend && npm install
cd ../backend && npm install
```

**Run backend**

```bash
cd backend
npm run dev
# http://localhost:3001
```

**Run frontend**

```bash
cd frontend
npm run dev
# http://localhost:5173
```

---

## 📁 Data Example

**Simulation**

```json
{ "id":1, "creditType":"auto", "amount":15000, "months":48, "annualRate":5.5 }
```

**Application**

```json
{ "id":1, "simulationId":1, "name":"Omar", "status":"en attente" }
```

---

## 📦 Key Dependencies

**Frontend:** react, react-router-dom, axios, tailwindcss, zustand, jsPDF, papaparse
**Backend:** json-server, nodemon

---

## 🚀 Features

* Credit simulation (monthly payment, total cost, amortization)
* Loan request submission (form + PDF export)
* Admin dashboard (filter, notes, status, export CSV)
* Simple notifications (via json-server)

---

## 🧠 Quick Commands

```bash
npm run dev        # start dev server
npm run build      # build frontend
```

---

## 📜 License

MIT License
