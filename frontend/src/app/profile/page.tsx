"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, ShieldCheck, Mail, Calendar, Key, AlertCircle, ShoppingBag, Package, Truck, ArrowRight } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Profile() {
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Profile edit fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfileAndOrders = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${API_URL}/auth/profile`, { headers });
        
        setProfile(response.data);
        setName(response.data.name);
        setEmail(response.data.email);
        
        // Fetch order history from localstorage
        const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        setOrders(localOrders);
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Your session has expired. Please log in again.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndOrders();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload: any = { name, email };
      if (password) payload.password = password;

      const response = await axios.put(`${API_URL}/auth/profile`, payload, { headers });
      
      // Update local storage user details
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setProfile({ ...profile, name: response.data.user.name, email: response.data.user.email });
      
      // Clear password fields
      setPassword('');
      setConfirmPassword('');
      
      // Notify header and layout of the name change
      window.dispatchEvent(new Event('user-logged-in'));
      
      setMessage("Profile updated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-24">
      {/* Upper Hero Section */}
      <div className="bg-[#1c1917] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                <User className="w-8 h-8 text-stone-200" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold tracking-tight">{profile?.name}</h1>
                <p className="text-stone-400 text-sm">{profile?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-emerald-950/40 text-emerald-400 px-4 py-2 border border-emerald-800 rounded-sm">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-semibold">
                Verified Account: {profile?.role === 'SUPER_ADMIN' ? 'ERP Admin' : profile?.role === 'SELLER' ? 'Wholesale Merchant' : 'Customer'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Column 1 & 2: Account Details & Editing */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Edit Details Block */}
            <div className="bg-white p-8 border border-stone-200 rounded-sm shadow-sm">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-8 border-b border-stone-100 pb-4">Personal Details</h2>
              
              {message && (
                <div className="bg-emerald-50 text-emerald-600 text-sm p-4 rounded-md mb-6 border border-emerald-100">
                  {message}
                </div>
              )}

              {error && (
                <div className="bg-rose-50 text-rose-600 text-sm p-4 rounded-md mb-6 border border-rose-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-6 mt-8">
                  <h3 className="text-sm font-semibold text-stone-900 mb-6 flex items-center gap-2">
                    <Key className="w-4 h-4 text-stone-400" /> Change Password (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">New Password</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-stone-900 text-white px-8 py-3.5 uppercase tracking-widest font-semibold text-xs hover:bg-black transition rounded-sm disabled:opacity-50 mt-4 shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Profile Details'}
                </button>
              </form>
            </div>

            {/* Order History Block */}
            <div className="bg-white p-8 border border-stone-200 rounded-sm shadow-sm">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-8 border-b border-stone-100 pb-4">Order History</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100">
                    <ShoppingBag className="w-6 h-6 text-stone-400" />
                  </div>
                  <p className="text-stone-500 text-sm mb-6">You haven't placed any orders yet.</p>
                  <Link href="/shop" className="inline-flex items-center gap-2 bg-stone-950 text-white px-6 py-3 uppercase tracking-widest font-bold text-[10px] hover:bg-black transition">
                    Start Shopping <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.orderId} className="border border-stone-200 rounded-sm p-6 space-y-4 hover:border-stone-400 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-2">
                        <div>
                          <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Order Reference</p>
                          <h4 className="text-lg font-bold text-stone-900 font-serif">{order.orderId}</h4>
                        </div>
                        <div className="text-sm text-stone-600 sm:text-right">
                          <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Placed On</p>
                          <span className="font-semibold text-stone-800">{order.date}</span>
                        </div>
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-100">
                            <Truck className="w-3.5 h-3.5" /> {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-stone-700 font-medium">
                              {item.name} <span className="text-stone-400 text-xs">x{item.quantity}</span>
                            </span>
                            <span className="text-stone-950 font-bold">€{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-stone-100 pt-4 gap-2 text-xs">
                        <div className="text-stone-500">
                          Tracking: <strong className="text-stone-700 select-all">{order.trackingNumber}</strong>
                        </div>
                        <div className="text-sm font-bold text-stone-950 sm:text-right">
                          Total Paid: €{order.total}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Column 3: Summary & Support */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 border border-stone-200 rounded-sm shadow-sm">
              <h3 className="font-serif font-bold text-stone-900 text-lg mb-6 border-b border-stone-100 pb-3">Membership</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Account Since</p>
                    <p className="text-sm font-semibold text-stone-800">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'May 2026'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Communication</p>
                    <p className="text-sm font-semibold text-stone-800">Email Updates Active</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1c1917] text-stone-300 p-8 border border-stone-800 rounded-sm shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="font-serif font-bold text-white text-lg mb-4 relative z-10">B2B Solutions</h3>
              <p className="text-xs text-stone-400 leading-relaxed mb-6 relative z-10">
                Unlock exclusive wholesale pricing, tax-exempt purchasing, and automatic order fulfillment routing by linking your VAT number.
              </p>
              <Link href="/wholesale" className="relative z-10 inline-flex items-center gap-2 bg-white text-stone-950 font-bold text-[10px] uppercase tracking-widest px-5 py-3 hover:bg-stone-200 transition shadow-md">
                Configure VAT
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
