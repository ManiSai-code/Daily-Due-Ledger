import React, { useCallback, useEffect, useState } from 'react';
import { assignBorrowers, createReadOnlyUser, getAllPeople, getUsers } from '../api/apiServices';
import type { AuthUser, Person } from '../types';

export const AdminAccess: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [loadedUsers, loadedPeople] = await Promise.all([getUsers(), getAllPeople()]);
    setUsers(loadedUsers);
    setPeople(loadedPeople);
    if (loadedUsers.length > 0 && (!selectedUserId || !loadedUsers.some((user) => user.id === selectedUserId))) {
      const firstReadOnlyUser = loadedUsers.find((user) => user.role === 'READ_ONLY') || loadedUsers[0];
      setSelectedUserId(firstReadOnlyUser.id);
      setSelectedPersonIds(firstReadOnlyUser.assignedPersonIds || []);
    }
  }, [selectedUserId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectUser = (id: string) => {
    const user = users.find((item) => item.id === id);
    setSelectedUserId(id);
    setSelectedPersonIds(user?.assignedPersonIds || []);
  };

  const togglePerson = (id: string) => {
    setSelectedPersonIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    await createReadOnlyUser(newUser);
    setNewUser({ name: '', email: '', password: '' });
    setMessage('Read-only user created.');
    await load();
  };

  const saveAssignments = async () => {
    await assignBorrowers(selectedUserId, selectedPersonIds);
    setUsers((current) =>
      current.map((user) =>
        user.id === selectedUserId ? { ...user, assignedPersonIds: selectedPersonIds } : user
      )
    );
    setMessage('Borrower access saved.');
  };

  const selectedUser = users.find((user) => user.id === selectedUserId);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">User Access Management</h1>
        <p className="text-sm text-slate-500">
          Create read-only users, then select one below and assign the borrowers whose profiles and transactions they can view.
        </p>
      </div>
      {message && <p className="bg-emerald-50 text-emerald-700 rounded-lg p-3 text-sm">{message}</p>}
      <form onSubmit={createUser} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h2 className="font-bold text-slate-800">Create read-only user</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input required placeholder="Name" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
          <input required type="email" placeholder="Email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
          <input required minLength={8} type="password" placeholder="Password (8+ characters)" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
        </div>
        <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm">Create User</button>
      </form>
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Select read-only user to assign borrowers
          <select value={selectedUserId} onChange={(event) => selectUser(event.target.value)} className="block mt-1 border border-slate-300 rounded-lg px-3 py-2 w-full">
            {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.role})</option>)}
          </select>
        </label>
        {selectedUser?.role === 'READ_ONLY' && (
          <>
            <p className="text-sm text-slate-600">
              Check the borrowers this user may access. Their transaction history and reports will be limited to these selections.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {people.map((person) => (
                <label key={person.id} className="flex items-center gap-2 border border-slate-200 rounded-lg p-3 text-sm">
                  <input type="checkbox" checked={selectedPersonIds.includes(person.id)} onChange={() => togglePerson(person.id)} />
                  <span>{person.fullName} <small className="text-slate-500">₹{person.currentBalance.toLocaleString('en-IN')}</small></span>
                </label>
              ))}
            </div>
            <button type="button" onClick={() => void saveAssignments()} className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm">Save Borrower Access</button>
          </>
        )}
        {selectedUser?.role === 'ADMIN' && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            Administrators already have access to all borrowers. Select a user marked READ_ONLY to assign specific borrowers.
          </p>
        )}
      </div>
    </section>
  );
};
