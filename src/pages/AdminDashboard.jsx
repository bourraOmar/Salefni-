import { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [application, setApplication] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const fetchApplication = async () => {
      const res = await fetch("http://localhost:3001/applications");
      const data = await res.json();

      console.log(data);
    };

    fetchApplication();
  });

  const filteredApp = application.filter((app) => {
    const matchesSearch =
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font font-bold mb-4 text-center">
        Admin Dashboard
      </h1>
      <div className="flex flex-col justify-beteew items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom ou email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg p2 w-full"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-lg p2 w-full"
        >
          <option value="">All statuts</option>
          <option value="pending">Panding</option>
          <option value="in progress">In progress</option>
          <option value="accepted">Accepted</option>
          <option value="refused">Refuse</option>
        </select>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full text-sm text-left border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">#</th>
              <th className="p-3 border">Full Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">credit Type</th>
              <th className="p-3 border">Statut</th>
              <th className="p-3 border">Revenu (MAD)</th>
              <th className="p-3 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredApp.length > 0 ? (
              filteredApp.map((app) => (
                <tr>
                  <td className="p-3 border">{app.id}</td>
                  <td className="p-3 border">{app.fullName}</td>
                  <td className="p-3 border">{app.email}</td>
                  <td className="p-3 border">{app.creditTypeId}</td>
                  <td className="p-3 border">
                    <span
                      className={`px-2 py-1 runded text-xs ${
                        app.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : app.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : app.status === "refused"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3 border">{app.monthlyIncome}</td>
                  <td className="p-3 border">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  Aucune demande trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
