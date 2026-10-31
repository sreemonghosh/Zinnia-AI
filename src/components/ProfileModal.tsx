import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Mail, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Apple, 
  Trash2, 
  LogOut, 
  Loader2, 
  Check, 
  AlertTriangle,
  RefreshCw,
  Key,
  Globe
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  subscribeToDevices, 
  revokeDevice, 
  DeviceSessionInfo,
  resendVerification,
  deleteCurrentAccount,
  getOrCreateDeviceId,
  resetPassword
} from '../services/authService';
import { cn } from '../lib/utils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile & { emailVerified?: boolean; uid?: string; authProviders?: string[] };
  onUpdate: (updates: Partial<UserProfile>) => Promise<any>;
  onLogout: () => void;
}

export function ProfileModal({ isOpen, onClose, user, onUpdate, onLogout }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'devices' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState(user.name);
  const [gender, setGender] = useState<UserProfile['gender']>(user.gender || 'other');
  const [location, setLocation] = useState(user.location || '');

  // Active Devices
  const [devices, setDevices] = useState<DeviceSessionInfo[]>([]);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    setName(user.name);
    setGender(user.gender || 'other');
    setLocation(user.location || '');
  }, [user]);

  // Subscribe to real-time active devices
  useEffect(() => {
    if (!isOpen || !user.uid) return;
    const unsub = subscribeToDevices(user.uid, (list) => {
      setDevices(list);
    });
    return () => unsub();
  }, [isOpen, user.uid]);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onUpdate({ name, gender, location });
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailVerification = async () => {
    setResendingVerification(true);
    setErrorMsg(null);
    try {
      await resendVerification();
      setSuccessMsg("Verification email sent! Please check your inbox.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend verification.");
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user.email) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await resetPassword(user.email);
      setResetEmailSent(true);
      setSuccessMsg("Password reset email sent to your address.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!user.uid) return;
    try {
      await revokeDevice(user.uid, deviceId);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to revoke device.");
    }
  };

  const handleRevokeAllOtherDevices = async () => {
    if (!user.uid) return;
    const currentId = getOrCreateDeviceId();
    try {
      const otherDevices = devices.filter(d => d.deviceId !== currentId);
      for (const d of otherDevices) {
        await revokeDevice(user.uid, d.deviceId);
      }
      setSuccessMsg("Logged out from all other devices.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to revoke devices.");
    }
  };

  const handleDeleteAccountPermanent = async () => {
    if (confirmDeleteText !== 'DELETE') return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await deleteCurrentAccount();
      onLogout();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete account. You may need to log in again first.");
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'windows': return <Monitor className="w-4 h-4 text-sky-400" />;
      case 'ios': return <Apple className="w-4 h-4 text-purple-400" />;
      case 'android': return <Smartphone className="w-4 h-4 text-emerald-400" />;
      default: return <Globe className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-11 h-11 rounded-full border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/5"
              />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  {user.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                  {user.email || 'No email registered'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl my-4 border border-slate-200/50 dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === 'profile'
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('devices')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                activeTab === 'devices'
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              <span>Devices</span>
              <span className="px-1.5 py-0.2 bg-indigo-500/10 text-indigo-500 text-[10px] rounded-full font-mono">
                {devices.length || 1}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === 'security'
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              Security
            </button>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Email Verification Banner */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Email Verification</p>
                      <p className="text-[11px] text-slate-500">
                        {user.emailVerified ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
                          </span>
                        ) : (
                          <span className="text-amber-500 font-semibold">Unverified</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {!user.emailVerified && (
                    <button
                      type="button"
                      onClick={handleResendEmailVerification}
                      disabled={resendingVerification}
                      className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors font-semibold disabled:opacity-50"
                    >
                      {resendingVerification ? 'Sending...' : 'Resend Email'}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Rather not say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </form>
            )}

            {/* TAB 2: ACTIVE DEVICES & SESSIONS */}
            {activeTab === 'devices' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your account is synchronized across these active devices.
                  </p>
                  {devices.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRevokeAllOtherDevices}
                      className="text-[11px] text-rose-500 hover:underline font-semibold"
                    >
                      Log out other devices
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {devices.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
                      Loading registered devices...
                    </div>
                  ) : (
                    devices.map((dev) => (
                      <div
                        key={dev.deviceId}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                            {getPlatformIcon(dev.platform)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {dev.deviceName}
                              </h4>
                              {dev.isCurrentDevice && (
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                                  This Device
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Last active: {new Date(dev.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {dev.platform.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {!dev.isCurrentDevice && (
                          <button
                            type="button"
                            onClick={() => handleRevokeDevice(dev.deviceId)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Revoke session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SECURITY & DANGER ZONE */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                {/* Connected Providers */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span>Connected Authentication Providers</span>
                  </h4>
                  <div className="flex items-center gap-2 pt-1">
                    {user.authProviders?.includes('google.com') ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium flex items-center gap-1.5">
                        <Check className="w-3 h-3" /> Google Account Linked
                      </span>
                    ) : null}
                    {user.authProviders?.includes('password') ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium flex items-center gap-1.5">
                        <Check className="w-3 h-3" /> Email & Password
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Password Reset */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-500" />
                    <span>Change or Reset Password</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Receive a secure recovery link to update your Zinnia AI password.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={loading || resetEmailSent}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resetEmailSent ? 'Reset Email Sent' : 'Send Password Reset Email'}
                  </button>
                </div>

                {/* Danger Zone: Account Deletion */}
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 space-y-2">
                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Delete Account Permanently</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This permanently removes your account, conversations, messages, and device sessions from the cloud. This action cannot be undone.
                  </p>

                  {!isDeletingAccount ? (
                    <button
                      type="button"
                      onClick={() => setIsDeletingAccount(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Delete My Account
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-rose-200 dark:border-rose-500/20">
                      <p className="text-[11px] text-rose-600 font-mono">
                        Type <strong>DELETE</strong> below to confirm:
                      </p>
                      <input
                        type="text"
                        placeholder="Type DELETE"
                        value={confirmDeleteText}
                        onChange={(e) => setConfirmDeleteText(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-white/5 border border-rose-300 dark:border-rose-500/40 rounded-lg text-xs outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDeleteAccountPermanent}
                          disabled={confirmDeleteText !== 'DELETE' || loading}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs"
                        >
                          Confirm Permanent Deletion
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsDeletingAccount(false); setConfirmDeleteText(''); }}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action: Logout */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex items-center gap-2 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out of Zinnia AI</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
