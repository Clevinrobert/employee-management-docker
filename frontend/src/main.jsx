import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const emptyEmployee = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  salary: ""
};

function App() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyEmployee);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const loadEmployees = async (term = "") => {
    const url = term
      ? `/api/employees/search?q=${encodeURIComponent(term)}`
      : "/api/employees";
    const response = await fetch(url);
    setEmployees(await response.json());
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `/api/employees/${editingId}`
      : "/api/employees";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, salary: Number(form.salary) })
    });

    if (!response.ok) {
      setMessage("Unable to save employee.");
      return;
    }

    setForm(emptyEmployee);
    setEditingId(null);
    setMessage(editingId ? "Employee updated." : "Employee added.");
    loadEmployees(search);
  };

  const editEmployee = (employee) => {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      salary: employee.salary
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEmployee = async (id) => {
    if (!confirm("Delete this employee?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setMessage("Employee deleted.");
    loadEmployees(search);
  };

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  return (
    <main>
      <header>
        <h1>Employee Management System</h1>
        <p>Dockerized full-stack employee management application</p>
      </header>

      <section className="card">
        <h2>{editingId ? "Update Employee" : "Add Employee"}</h2>
        <form onSubmit={submit} className="form-grid">
          {["name", "email", "phone", "department", "designation", "salary"].map((field) => (
            <input
              key={field}
              name={field}
              type={field === "salary" ? "number" : "text"}
              placeholder={field[0].toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={updateField}
              required
            />
          ))}
          <button type="submit">{editingId ? "Update" : "Add"} Employee</button>
          {editingId && (
            <button type="button" className="secondary" onClick={() => {
              setEditingId(null);
              setForm(emptyEmployee);
            }}>Cancel</button>
          )}
        </form>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="card">
        <div className="toolbar">
          <h2>Employees</h2>
          <input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              loadEmployees(e.target.value);
            }}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Salary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.phone}</td>
                  <td>{employee.department}</td>
                  <td>{employee.designation}</td>
                  <td>{employee.salary}</td>
                  <td>
                    <button onClick={() => editEmployee(employee)}>Edit</button>
                    <button className="danger" onClick={() => deleteEmployee(employee.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
