import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User, LogIn, UserPlus, Phone, Mail, Lock, LogOut } from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Edit State
  const [editingMember, setEditingMember] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setMembers(data);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('members')
        .insert([{ email, password, phone }])
        .select();

      if (dbError) {
        if (dbError.code === '23505') throw new Error('이미 존재하는 이메일입니다.');
        throw dbError;
      }

      alert('회원가입이 완료되었습니다!');
      setIsSignup(false);
      fetchMembers();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('members')
        .select('*')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (dbError || !data) {
        throw new Error('존재하지 않는 이메일입니다.');
      }

      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ email, phone })
        .eq('id', editingMember.id);

      if (error) throw error;

      alert('수정되었습니다.');
      setEditingMember(null);
      fetchMembers();
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMembers();
      if (user.id === id) handleLogout();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPhone('');
  };

  const handleLogout = () => {
    setUser(null);
    setMembers([]);
    resetForm();
  };

  const openEdit = (member) => {
    setEditingMember(member);
    setEmail(member.email);
    setPhone(member.phone || '');
  };

  if (user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
        <div className="auth-container profile-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#fff5e6', padding: '1rem', borderRadius: '50%' }}>
              <User size={48} color="#ff8c00" />
            </div>
          </div>
          <h2>관리자 대시보드</h2>
          <p>접속 계정: <strong>{user.email}</strong></p>
          <button onClick={handleLogout} className="delete-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>로그아웃</button>
        </div>

        <div className="member-list">
          <div className="header-row">
            <h3>회원 목록 (CRUD)</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <User size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888' }} />
                <input
                  placeholder="No. 또는 이름으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '35px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.9rem', width: '220px' }}
                />
              </div>
              <button className="add-btn" style={{ background: '#6366f1' }} onClick={() => window.open('/members.html', '_blank')}>Premium 대시보드 보기</button>
              <button className="add-btn" onClick={() => setIsSignup(true)}>회원 추가</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>이름</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {members
                .filter((m, idx) => {
                  const no = (members.length - idx).toString();
                  const name = (m.full_name || '').toLowerCase();
                  const search = searchTerm.toLowerCase();
                  return name.includes(search) || no.includes(search) || (m.phone || '').includes(search);
                })
                .map((m, idx) => (
                  <tr key={m.id}>
                    <td>{members.length - idx}</td>
                    <td>{m.full_name || '-'}</td>
                    <td>{m.email}</td>
                    <td>{m.phone || '-'}</td>
                    <td className="action-btns">
                      <button className="edit-btn" onClick={() => openEdit(m)}>수정</button>
                      <button className="delete-btn" onClick={() => handleDelete(m.id)}>삭제</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editingMember && (
          <div className="modal">
            <div className="modal-content auth-container" style={{ animation: 'none' }}>
              <h3>회원 정보 수정</h3>
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label>이메일</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>연락처</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <button type="submit">저장하기</button>
                <button type="button" onClick={() => { setEditingMember(null); resetForm(); }} style={{ background: '#eee', color: '#333' }}>취소</button>
              </form>
            </div>
          </div>
        )}

        {/* Add Modal (Reuse Signup logic) */}
        {isSignup && !editingMember && (
          <div className="modal">
            <div className="modal-content auth-container" style={{ animation: 'none' }}>
              <h3>새 회원 추가</h3>
              <form onSubmit={handleSignup}>
                <div className="form-group">
                  <label>이메일</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>비밀번호</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>연락처</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <button type="submit">등록하기</button>
                <button type="button" onClick={() => { setIsSignup(false); resetForm(); }} style={{ background: '#eee', color: '#333' }}>취소</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div style={{ background: '#fff5e6', padding: '1rem', borderRadius: '50%' }}>
          {isSignup ? <UserPlus size={40} color="#ff8c00" /> : <LogIn size={40} color="#ff8c00" />}
        </div>
      </div>
      <h2>{isSignup ? 'Create Account' : 'Login'}</h2>

      <form onSubmit={isSignup ? handleSignup : handleLogin}>
        <div className="form-group">
          <label>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
            <input
              type="email"
              placeholder="example@mail.com"
              required
              style={{ paddingLeft: '40px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {isSignup && (
          <div className="form-group">
            <label>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
              <input
                type="tel"
                placeholder="010-0000-0000"
                style={{ paddingLeft: '40px' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : (isSignup ? 'Register Now' : 'Sign In')}
        </button>
      </form>

      <div className="toggle-link">
        {isSignup ? (
          <p>Already have an account? <span onClick={() => setIsSignup(false)}>Sign In</span></p>
        ) : (
          <p>Don't have an account? <span onClick={() => setIsSignup(true)}>Register</span></p>
        )}
      </div>
    </div>
  );
}

export default App;
