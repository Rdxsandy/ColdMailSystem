import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Login = () => {
  const { user, loading, loginWithGoogle } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#17AC4E', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Title */}
        <h1 style={{
          fontSize: 52,
          fontWeight: 800,
          color: '#111827',
          marginBottom: 32,
          lineHeight: 1.1,
          textAlign: 'center'
        }}>
          Login
        </h1>

        {/* Login with Google */}
        <button
          onClick={loginWithGoogle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: '#E8F8EF',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            padding: '14px 20px',
            fontSize: 16,
            fontWeight: 500,
            color: '#111827',
            cursor: 'pointer',
            transition: 'background 0.15s, box-shadow 0.15s',
            fontFamily: 'Inter, sans-serif',
            marginBottom: 20,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#d4f0e0')}
          onMouseLeave={e => (e.currentTarget.style.background = '#E8F8EF')}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 22, height: 22 }} />
          Login with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ fontSize: 13, color: '#9CA3AF', whiteSpace: 'nowrap' }}>or sign up through email</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="Email ID"
            className="input"
            style={{ borderRadius: 10, padding: '14px 16px', fontSize: 15 }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 24 }}>
          <input
            type="password"
            placeholder="Password"
            className="input"
            style={{ borderRadius: 10, padding: '14px 16px', fontSize: 15 }}
          />
        </div>

        {/* Login button */}
        <button
          className="btn-green"
          style={{ width: '100%', justifyContent: 'center', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 600 }}
          onClick={loginWithGoogle}
        >
          Login
        </button>
      </motion.div>
    </div>
  );
};
