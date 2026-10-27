import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, UserCheck, Building2, Lock, Mail, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  demoUsers: User[];
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, demoUsers }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Harap lengkapi email dan kata sandi.');
      return;
    }

    if (isRegister && !name) {
      setErrorMsg('Harap isi nama lengkap pengguna.');
      return;
    }

    if (isRegister && selectedRole === 'faskes' && !facilityName) {
      setErrorMsg('Harap isi nama Rumah Sakit / Faskes.');
      return;
    }

    const newUser: User = {
      id: `USR-${Date.now()}`,
      name: name || (email.split('@')[0] ?? 'User'),
      email,
      role: selectedRole,
      facilityId: selectedRole === 'faskes' ? `FK-${Date.now().toString().slice(-4)}` : undefined,
      facilityName: selectedRole === 'faskes' ? facilityName || 'Faskes Mandiri' : 'Kantor BPJS Cabang',
    };

    onLoginSuccess(newUser);
  };

  const handleQuickLogin = (role: UserRole, index: number) => {
    const target = demoUsers.find((u) => u.role === role) || demoUsers[index];
    if (target) {
      onLoginSuccess(target);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-200"
        >
          <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
        </motion.div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
          Veri<span className="text-emerald-600">Med</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Platform Integritas & Verifikasi Kriptografis Klaim Pelayanan Kesehatan
        </p>

        {/* Info banner */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-800">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Didukung Penyegelan Merkle & Model Analitik Nasional</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100"
        >
          {/* Quick Demo Access Buttons */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50/80 border border-emerald-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Akses Demo Cepat (1-Klik)
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-100/60 font-medium px-2 py-0.5 rounded-full">
                Siap Evaluasi
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 0)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    AD
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      dr. Budi Setiawan, Sp.PK
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Peran: <strong className="text-emerald-700">Admin & Verifikator</strong>
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('faskes', 1)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                    FK
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700">
                      dr. Rina Puspita (RS Siloam Sejahtera)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Peran: <strong className="text-teal-700">Faskes (Pengajuan Klaim)</strong>
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-400 font-medium">atau masuk dengan akun</span>
            </div>
          </div>

          {/* Form Tab Switcher (Masuk / Daftar) */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isRegister
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isRegister
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registrasi Baru
            </button>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Pilih Peran:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  selectedRole === 'admin'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`mt-0.5 p-1 rounded-md ${
                    selectedRole === 'admin' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-none">Admin</p>
                  <p className="text-[10px] text-slate-500 mt-1">Verifikator & Manajemen</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('faskes')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  selectedRole === 'faskes'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`mt-0.5 p-1 rounded-md ${
                    selectedRole === 'faskes' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-none">Faskes</p>
                  <p className="text-[10px] text-slate-500 mt-1">RS & Penyedia Layanan</p>
                </div>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 italic">
              *Tugas verifikator digabung dalam peran Admin.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-700">Nama Lengkap</label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="dr. Contoh Pratama"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}

            {isRegister && selectedRole === 'faskes' && (
              <div>
                <label className="block text-xs font-medium text-slate-700">Nama Fasilitas Kesehatan</label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    placeholder="RS Hermina / Klinik Medika"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700">Alamat Email</label>
              <div className="mt-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'admin@verimed.id' : 'koder@rumahsakit.id'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Kata Sandi</label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              <span>{isRegister ? 'Daftar & Masuk' : 'Masuk ke Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>

        {/* Security / Legal disclaimer footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          VeriMed v2.0 • Segel membuktikan apa yang diterima dan kapan, bukan keaslian pengukuran di sumber.
        </p>
      </div>
    </div>
  );
};
