import React, { useState } from 'react';
import { Plus, Trash2, Receipt, ArrowRight, RotateCcw, Calculator, Users, CreditCard, ChevronRight, ChevronLeft, Share, Check, Download } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState([
    { id: 1, name: '' },
    { id: 2, name: '' }
  ]);
  const [expenses, setExpenses] = useState([
    { id: 1, memberId: '', detail: '', amount: '' }
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const getInitialTheme = () => {
    const saved = localStorage.getItem('artic-theme');
    if (saved) return saved;
    const hour = new Date().getHours();
    return (hour >= 7 && hour < 19) ? 'light' : 'dark';
  };

  const [theme, setThemeState] = useState(getInitialTheme());

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(nextTheme);
    localStorage.setItem('artic-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.body.classList.toggle('light-theme', nextTheme === 'light');
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('artic-theme');
    let activeTheme = 'dark';
    if (savedTheme) {
      activeTheme = savedTheme;
    } else {
      const hour = new Date().getHours();
      activeTheme = (hour >= 7 && hour < 19) ? 'light' : 'dark';
    }
    setThemeState(activeTheme);
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
    document.body.classList.toggle('light-theme', activeTheme === 'light');
    
    const updateClock = () => {
      const now = new Date();
      const options = {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      const timeString = now.toLocaleTimeString('ko-KR', options);
      const clockEl = document.getElementById('kst-clock-calc');
      if (clockEl) clockEl.textContent = `KST ${timeString}`;
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyScreenshot = async () => {
    const element = document.getElementById('screenshot-target');
    if (!element) return;
    
    setCopied('loading');
    
    try {
      const canvas = await window.html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('이미지 생성에 실패했습니다.');
          setCopied(false);
          return;
        }
        
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch (clipboardErr) {
          console.warn('Clipboard copy failed, downloading fallback:', clipboardErr);
          
          const link = document.createElement('a');
          link.download = 'TNT-정산결과.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          setCopied('fallback');
          setTimeout(() => setCopied(false), 3000);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Screenshot failed:', err);
      alert('정산 결과를 이미지로 만드는 중 오류가 발생했습니다.');
      setCopied(false);
    }
  };

  const addMember = () => setMembers([...members, { id: Date.now(), name: '' }]);
  
  const removeMember = (id) => {
    if (members.length <= 2) {
      setError('최소 2명 이상이어야 합니다.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setMembers(members.filter(m => m.id !== id));
    setExpenses(expenses.filter(e => e.memberId !== id));
  };

  const handleMemberChange = (id, value) => {
    setMembers(members.map(m => m.id === id ? { ...m, name: value } : m));
  };

  const goToNextStep = () => {
    setError('');
    const validMembers = members.filter(m => m.name.trim() !== '');
    if (validMembers.length < 2) {
      setError('참여할 멤버의 이름을 2명 이상 입력해주세요.');
      return;
    }
    setStep(2);
    
    const updatedExpenses = expenses.map(exp => {
      const memberExists = validMembers.find(m => m.id === exp.memberId);
      return memberExists ? exp : { ...exp, memberId: '' };
    });
    setExpenses(updatedExpenses);
  };

  const handleStepNavigation = (targetStep) => {
    if (targetStep === step) return;
    setError('');

    if (targetStep === 1) {
      setStep(1);
    } else if (targetStep === 2) {
      if (step === 1) goToNextStep();
      else setStep(2);
    } else if (targetStep === 3) {
      if (step === 2) calculate();
      else if (step === 1) setError('지출 내역을 먼저 입력해야 결과를 확인할 수 있습니다.');
    }
  };

  const addExpense = () => setExpenses([...expenses, { id: Date.now(), memberId: '', detail: '', amount: '' }]);
  const removeExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));

  const handleExpenseChange = (id, field, value) => {
    if (field === 'amount') value = value.replace(/[^0-9]/g, '');
    if (field === 'memberId') value = value ? Number(value) : '';
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const calculate = () => {
    setError('');
    const validMembers = members.filter(m => m.name.trim() !== '');
    const validExpenses = expenses.filter(e => e.memberId !== '' && e.amount !== '');

    if (validExpenses.length === 0) {
      setError('지출 내역을 1건 이상 올바르게 입력해주세요.');
      return;
    }

    const memberTotals = {};
    validMembers.forEach(m => { memberTotals[m.id] = { name: m.name, total: 0 }; });

    let total = 0;
    validExpenses.forEach(e => {
      const amount = Number(e.amount);
      if (memberTotals[e.memberId]) {
        memberTotals[e.memberId].total += amount;
        total += amount;
      }
    });

    const average = total / validMembers.length;
    let receivers = [];
    let senders = [];

    Object.values(memberTotals).forEach(m => {
      const balance = m.total - average;
      if (balance > 0.1) receivers.push({ name: m.name, amount: balance });
      else if (balance < -0.1) senders.push({ name: m.name, amount: -balance });
    });

    const transfers = [];
    let i = 0, j = 0;

    while (i < senders.length && j < receivers.length) {
      let sender = senders[i];
      let receiver = receivers[j];
      let transferAmount = Math.min(sender.amount, receiver.amount);

      transfers.push({ sender: sender.name, receiver: receiver.name, amount: transferAmount });
      sender.amount -= transferAmount;
      receiver.amount -= transferAmount;
      if (sender.amount < 0.1) i++;
      if (receiver.amount < 0.1) j++;
    }

    setResults({ total, average, transfers, memberCount: validMembers.length });
    setStep(3);
  };

  const reset = () => {
    setMembers([{ id: 1, name: '' }, { id: 2, name: '' }]);
    setExpenses([{ id: 1, memberId: '', detail: '', amount: '' }]);
    setResults(null);
    setError('');
    setStep(1);
  };

  const validMembers = members.filter(m => m.name.trim() !== '');

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 font-sans flex flex-col items-center ${theme === 'light' ? 'bg-[#f5f6fa] text-slate-800' : 'bg-[#0d0f14] text-slate-100'}`}>
      
      {/* Unified Top Branding Header */}
      <header className="w-full h-[70px] flex items-center justify-between px-4 md:px-6 z-50 sticky top-0 bg-transparent border-none backdrop-blur-none pointer-events-none">
        <div 
          onClick={() => location.href = '../'} 
          className={`cursor-pointer flex items-center gap-2 px-4 h-[38px] box-border rounded-full border transition-all duration-300 backdrop-blur-md shadow-sm pointer-events-auto ${
            theme === 'light' 
              ? 'bg-slate-900/[0.03] border-slate-900/[0.08] hover:bg-slate-900/[0.06] hover:border-slate-900/20 hover:shadow-md' 
              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.05)]'
          }`}
        >
          <img 
            src="../artic-logo-full-ver.svg" 
            alt="ARTIC Logo" 
            className={`h-[14px] w-auto my-0 transition-all ${theme === 'dark' ? 'invert' : ''}`} 
          />
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            title="테마 변경"
            className={`w-[38px] h-[38px] rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-md shadow-sm pointer-events-auto ${
              theme === 'light' 
                ? 'bg-slate-900/[0.03] border-slate-900/[0.08] text-slate-600 hover:bg-slate-900/[0.06] hover:border-slate-900/20 hover:shadow-md' 
                : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:border-white/20 hover:shadow-md'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d={theme === 'light' ? "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z" : "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"} />
            </svg>
          </button>

          {/* Live Clock Widget */}
          <div className={`rounded-full border px-3 md:px-[18px] h-[38px] box-border flex items-center gap-1.5 md:gap-[10px] font-mono text-[0.78rem] md:text-[0.85rem] transition-all duration-300 backdrop-blur-md shadow-sm pointer-events-auto ${theme === 'light' ? 'bg-slate-900/[0.03] border-slate-900/[0.08] text-slate-600' : 'bg-white/[0.03] border-white/[0.08] text-slate-400'}`}>
            <div className="w-[6px] h-[6px] rounded-full bg-blue-600 shadow-[0_0_8px_#2563eb] animate-pulse" />
            <span id="kst-clock-calc">KST --:--:--</span>
          </div>
        </div>
      </header>

      {/* Main Container below header */}
      <div className="flex-1 w-full flex items-center justify-center p-4">
        <div 
          className={`w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh] border transition-all animate-fade-up ${
            theme === 'light' ? 'bg-white border-slate-100' : 'bg-[#181c27] border-white/5'
          }`}
          style={{ animationDelay: '0.15s' }}
        >
        
        {/* 헤더 부분 */}
        <div className="bg-blue-600 p-5 text-white flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <Receipt size={28} />
            <h1 className="text-xl font-bold">깔끔한 TNT 정산기</h1>
          </div>
          
          <div className="flex items-center justify-between text-xs font-medium text-blue-200 px-2">
            <button onClick={() => handleStepNavigation(1)} className={`hover:text-white transition-colors outline-none cursor-pointer ${step === 1 ? "text-white font-bold" : ""}`}>
              1. 멤버 입력
            </button>
            <span className="flex-1 mx-2 h-px bg-blue-400 opacity-50"></span>
            
            <button onClick={() => handleStepNavigation(2)} className={`hover:text-white transition-colors outline-none cursor-pointer ${step === 2 ? "text-white font-bold" : ""}`}>
              2. 지출 입력
            </button>
            <span className="flex-1 mx-2 h-px bg-blue-400 opacity-50"></span>
            
            <button onClick={() => handleStepNavigation(3)} className={`hover:text-white transition-colors outline-none cursor-pointer ${step === 3 ? "text-white font-bold" : ""}`}>
              3. 결과 확인
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="p-5 overflow-y-auto flex-1">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

          {/* [STEP 1] 멤버 입력 */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                <Users size={16} /> 누가 함께 했나요?
              </div>
              
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div key={member.id} className="flex gap-2 items-center">
                    <div className="w-8 text-center text-gray-400 font-bold text-sm">{index + 1}</div>
                    <input
                      type="text"
                      placeholder="이름"
                      value={member.name}
                      onChange={(e) => handleMemberChange(member.id, e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button onClick={() => removeMember(member.id)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={addMember} className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 text-sm mt-4">
                <Plus size={18} /> 멤버 추가하기
              </button>

              <button onClick={goToNextStep} className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-md">
                다음 단계로 <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* [STEP 2] 지출 내역 입력 */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                  <CreditCard size={16} /> 결제 내역을 추가해주세요
                </div>
              </div>
              
              <div className="space-y-4">
                {expenses.map((expense, index) => (
                  <div key={expense.id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl space-y-3 relative shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400">결제 건 #{index + 1}</span>
                      <button onClick={() => removeExpense(expense.id)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <select
                        value={expense.memberId}
                        onChange={(e) => handleExpenseChange(expense.id, 'memberId', e.target.value)}
                        className="w-1/3 sm:w-2/5 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white outline-none"
                      >
                        <option value="">결제자 선택</option>
                        {validMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      
                      <input
                        type="text"
                        placeholder="결제 내용"
                        value={expense.detail}
                        onChange={(e) => handleExpenseChange(expense.id, 'detail', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="금액을 입력하세요"
                        value={expense.amount ? Number(expense.amount).toLocaleString() : ''}
                        onChange={(e) => handleExpenseChange(expense.id, 'amount', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-3 pr-8 text-sm text-right focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">원</span>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addExpense} className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 text-sm mt-2">
                <Plus size={18} /> 결제 내역 추가하기
              </button>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold flex justify-center gap-2">
                  <ChevronLeft size={20} /> 이전
                </button>
                <button onClick={calculate} className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold text-lg flex justify-center gap-2 hover:bg-blue-700 shadow-md">
                  <Calculator size={20} /> 정산하기
                </button>
              </div>
            </div>
          )}

          {/* [STEP 3] 결과 화면 */}
          {step === 3 && results && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
              
              {/* Screenshot Target Card */}
              <div id="screenshot-target" className="bg-white p-4 rounded-xl border border-gray-100 space-y-5">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Receipt className="text-blue-600" size={20} />
                    <span className="font-bold text-gray-800 text-sm">TNT 정산 결과서</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">발행일: {new Date().toLocaleDateString('ko-KR')}</span>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 mb-3 text-center uppercase tracking-wide">정산 요약</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 text-sm">총 지출액 ({results.memberCount}명)</span>
                    <span className="font-bold text-base text-gray-800">{Math.round(results.total).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-600">
                    <span className="font-bold text-sm">1인당 부담액</span>
                    <span className="font-black text-lg">{Math.round(results.average).toLocaleString()}원</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 mb-3 text-center uppercase tracking-wide">💸 최종 송금 내역</h3>
                  {results.transfers.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl text-xs">
                      모두가 정확히 같은 금액을 지출했습니다.<br/>송금할 필요가 없어요! 🎉
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {results.transfers.map((transfer, idx) => (
                        <div key={idx} className="bg-white border border-blue-50 p-3 rounded-xl flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md text-xs">{transfer.sender}</span>
                            <ArrowRight size={14} className="text-blue-400" />
                            <span className="font-bold text-gray-700 bg-blue-50 px-2 py-0.5 rounded-md text-xs">{transfer.receiver}</span>
                          </div>
                          <div className="font-bold text-blue-600 text-sm">{Math.round(transfer.amount).toLocaleString()}원</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                <button 
                  onClick={copyScreenshot}
                  disabled={copied === 'loading'}
                  className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-md transition-all outline-none ${
                    copied === 'loading'
                      ? 'bg-blue-400 text-white cursor-wait'
                      : copied === true
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : copied === 'fallback'
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied === 'loading' ? (
                    <>이미지 생성 중...</>
                  ) : copied === true ? (
                    <>
                      <Check size={20} />
                      클립보드 이미지 복사 완료!
                    </>
                  ) : copied === 'fallback' ? (
                    <>
                      <Download size={20} />
                      기기에 정산서(PNG) 저장 완료!
                    </>
                  ) : (
                    <>
                      <Share size={20} />
                      정산 결과 화면 이미지 복사 (공유)
                    </>
                  )}
                </button>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold flex justify-center gap-2 hover:bg-gray-200">
                    <ChevronLeft size={20} /> 지출 수정
                  </button>
                  <button onClick={reset} className="flex-[2] bg-gray-800 text-white py-4 rounded-xl font-bold flex justify-center gap-2 hover:bg-gray-900">
                    <RotateCcw size={20} /> 처음부터 다시하기
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
