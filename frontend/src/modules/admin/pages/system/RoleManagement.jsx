import React, { useState, useEffect } from 'react';
import { rolesApi } from '../../services/api';
import { extractList, mapRole } from '../../utils/mappers';
import { 
  ShieldCheck, UserPlus, Search, CheckCircle2, 
  Trash2, Shield, Settings, Key, User, Edit2, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '../../components/ui';

const ALL_PERMISSIONS = [
  { group: 'Dashboard', items: ['dashboard.view', 'dashboard.analytics'] },
  { group: 'Users', items: ['users.view', 'users.edit', 'users.block', 'users.delete'] },
  { group: 'Products', items: ['products.view', 'products.edit', 'products.approve', 'products.delete'] },
  { group: 'Orders', items: ['orders.view', 'orders.edit', 'orders.cancel'] },
  { group: 'Finance', items: ['finance.view', 'finance.edit', 'finance.payout'] },
  { group: 'Sellers', items: ['sellers.view', 'sellers.edit', 'sellers.approve', 'sellers.suspend'] },
  { group: 'Categories', items: ['categories.view', 'categories.edit', 'categories.delete'] },
  { group: 'Banners', items: ['banners.view', 'banners.edit', 'banners.delete'] },
  { group: 'Reports', items: ['reports.view', 'reports.export'] },
  { group: 'Settings', items: ['settings.view', 'settings.edit'] },
  { group: 'Tickets', items: ['tickets.view', 'tickets.edit', 'tickets.close'] },
  { group: 'Returns', items: ['returns.view', 'returns.edit', 'returns.approve'] },
  { group: 'Coupons', items: ['coupons.view', 'coupons.edit', 'coupons.delete'] },
  { group: 'Notifications', items: ['notifications.view', 'notifications.send'] },
  { group: 'System', items: ['system.admins', 'system.roles', 'system.audit', 'system.settings'] },
];

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error: apiError } = await rolesApi.getAll();
    if (apiError) {
      setError(apiError);
      setRoles([]);
    } else {
      setError(null);
      setRoles(extractList(data).map(mapRole));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEdit = (role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setIsEditing(true);
  };

  const handleTogglePermission = (permission) => {
    setRoleForm(prev => {
      const isSelected = prev.permissions.includes(permission) || prev.permissions.includes('all');
      if (isSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => p !== permission && p !== 'all')
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, permission]
        };
      }
    });
  };

  const handleSave = async () => {
    if (!roleForm.name) return;

    if (selectedRole) {
      const { data, error: apiError } = await rolesApi.update(selectedRole.id, roleForm);
      if (!apiError) {
        setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...r, ...mapRole(data || roleForm) } : r));
      }
    } else {
      const { data, error: apiError } = await rolesApi.create(roleForm);
      if (!apiError) {
        setRoles(prev => [...prev, mapRole(data || { ...roleForm, id: Date.now(), members: 0, color: 'blue', createdAt: new Date().toISOString() })]);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Role Management</h1>
          <p className="text-slate-500 font-medium mt-1 font-raleway">Configure team roles, assign privileges, and manage role-based access control (RBAC).</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
          >
            <UserPlus size={16} />
            Create Custom Role
          </button>
        )}
      </div>

      {isEditing ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <h3 className="text-lg font-bold text-slate-900 font-montserrat uppercase">{selectedRole ? 'Edit Role Details' : 'Create New Role'}</h3>
            <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase">Back to Roles</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Role Name</label>
              <input 
                type="text" 
                placeholder="e.g. Content Writer"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Description</label>
              <input 
                type="text" 
                placeholder="Brief summary of duties and bounds"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Granular Permissions Matrix</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              {ALL_PERMISSIONS.map((group) => (
                <div key={group.group} className="space-y-3 bg-white p-4 rounded-xl border border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-1">{group.group}</h5>
                  <div className="space-y-2">
                    {group.items.map(item => {
                      const isChecked = roleForm.permissions.includes(item) || roleForm.permissions.includes('all');
                      return (
                        <label key={item} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-900">
                          <input 
                            type="checkbox"
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(item)}
                          />
                          {item.split('.')[1]}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-50">
            <button onClick={() => setIsEditing(false)} className="px-6 py-3.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
            <button onClick={handleSave} className="px-8 py-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <CheckCircle2 size={16} /> Save Role Config
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <motion.div 
              key={role.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Shield size={24} />
                  </div>
                  <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase">
                    {role.members} Members
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 font-montserrat uppercase leading-tight mb-2">{role.name}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">{role.description}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-50">
                <button 
                  onClick={() => handleEdit(role)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                >
                  <Edit2 size={12} /> Edit Config
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
