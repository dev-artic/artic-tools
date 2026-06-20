import React, { useState } from 'react';
import { ArrowRight, Calculator, Check, Download, Plus, Receipt, RotateCcw, Share, Trash2 } from 'lucide-react';

const initialMembers = () => [{ id: 1, name: '' }, { id: 2, name: '' }];
const initialExpenses = () => [{ id: 1, memberId: '', detail: '', amount: '' }];

export default function SettlementPanel() {
  const [members, setMembers] = useState(initialMembers);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const validMembers = members.filter((member) => member.name.trim());

  const addMember = () => setMembers((items) => [...items, { id: Date.now(), name: '' }]);
  const removeMember = (id) => {
    if (members.length <= 2) return setError('최소 2명 이상이어야 합니다.');
    setMembers((items) => items.filter((item) => item.id !== id));
    setExpenses((items) => items.filter((item) => item.memberId !== id));
  };
  const addExpense = () => setExpenses((items) => [...items, { id: Date.now(), memberId: '', detail: '', amount: '' }]);

  const calculate = () => {
    setError('');
    const validExpenses = expenses.filter((expense) => expense.memberId !== '' && expense.amount !== '');
    if (validMembers.length < 2) return setError('참여 멤버를 2명 이상 입력해주세요.');
    if (!validExpenses.length) return setError('지출 내역을 1건 이상 입력해주세요.');
    const totals = Object.fromEntries(validMembers.map((member) => [member.id, { name: member.name, total: 0 }]));
    let total = 0;
    validExpenses.forEach((expense) => {
      const amount = Number(expense.amount);
      if (totals[expense.memberId]) { totals[expense.memberId].total += amount; total += amount; }
    });
    const average = total / validMembers.length;
    const receivers = [];
    const senders = [];
    Object.values(totals).forEach((member) => {
      const balance = member.total - average;
      if (balance > 0.1) receivers.push({ name: member.name, amount: balance });
      if (balance < -0.1) senders.push({ name: member.name, amount: -balance });
    });
    const transfers = [];
    let senderIndex = 0;
    let receiverIndex = 0;
    while (senderIndex < senders.length && receiverIndex < receivers.length) {
      const sender = senders[senderIndex];
      const receiver = receivers[receiverIndex];
      const amount = Math.min(sender.amount, receiver.amount);
      transfers.push({ sender: sender.name, receiver: receiver.name, amount });
      sender.amount -= amount;
      receiver.amount -= amount;
      if (sender.amount < 0.1) senderIndex += 1;
      if (receiver.amount < 0.1) receiverIndex += 1;
    }
    setResults({ total, average, transfers, memberCount: validMembers.length });
  };

  const copyScreenshot = async () => {
    const element = document.getElementById('screenshot-target');
    if (!element || !window.html2canvas) return;
    setCopied('loading');
    try {
      const canvas = await window.html2canvas(element, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          setCopied(true);
        } catch {
          const link = document.createElement('a');
          link.download = 'TNT-정산결과.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          setCopied('fallback');
        }
        setTimeout(() => setCopied(false), 2500);
      }, 'image/png');
    } catch {
      setCopied(false);
      setError('정산 결과 이미지를 만드는 중 오류가 발생했습니다.');
    }
  };

  const reset = () => { setMembers(initialMembers()); setExpenses(initialExpenses()); setResults(null); setError(''); };

  return (
    <div className="page-stack settlement-page">
      <section className="page-heading"><div><span className="eyebrow">COST SPLITTER</span><h2>제작비 정산</h2><p>기존 TNT 정산 기능을 프로젝트 매니저 안에서 그대로 사용합니다.</p></div></section>
      {error && <div className="error-banner">{error}</div>}
      <div className="settlement-layout">
        <section className="panel settlement-inputs">
          <div className="panel-heading"><div><span className="eyebrow">01</span><h3>참여 멤버</h3></div><button className="text-button" onClick={addMember}><Plus size={15} /> 추가</button></div>
          <div className="compact-list">
            {members.map((member, index) => <div key={member.id}><span>{index + 1}</span><input value={member.name} onChange={(e) => setMembers((items) => items.map((item) => item.id === member.id ? { ...item, name: e.target.value } : item))} placeholder="이름" /><button className="icon-button danger" onClick={() => removeMember(member.id)}><Trash2 size={15} /></button></div>)}
          </div>

          <div className="panel-heading section-gap"><div><span className="eyebrow">02</span><h3>지출 내역</h3></div><button className="text-button" onClick={addExpense}><Plus size={15} /> 추가</button></div>
          <div className="expense-list">
            {expenses.map((expense) => <div className="expense-row" key={expense.id}>
              <select value={expense.memberId} onChange={(e) => setExpenses((items) => items.map((item) => item.id === expense.id ? { ...item, memberId: Number(e.target.value) || '' } : item))}><option value="">결제자</option>{validMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
              <input value={expense.detail} onChange={(e) => setExpenses((items) => items.map((item) => item.id === expense.id ? { ...item, detail: e.target.value } : item))} placeholder="내역" />
              <div className="money-input"><input inputMode="numeric" value={expense.amount ? Number(expense.amount).toLocaleString() : ''} onChange={(e) => setExpenses((items) => items.map((item) => item.id === expense.id ? { ...item, amount: e.target.value.replace(/[^0-9]/g, '') } : item))} placeholder="0" /><span>원</span></div>
              <button className="icon-button danger" onClick={() => setExpenses((items) => items.filter((item) => item.id !== expense.id))}><Trash2 size={15} /></button>
            </div>)}
          </div>
          <button className="primary-button full-button" onClick={calculate}><Calculator size={17} /> 정산 계산하기</button>
        </section>

        <section className="panel result-panel">
          {!results ? <div className="result-placeholder"><Receipt size={28} /><strong>정산 결과가 여기에 표시됩니다</strong><p>멤버와 지출 내역을 입력한 뒤 계산해주세요.</p></div> : <>
            <div id="screenshot-target" className="result-sheet">
              <div className="result-title"><span><Receipt size={18} /> TNT 정산 결과서</span><small>{new Date().toLocaleDateString('ko-KR')}</small></div>
              <div className="result-summary"><span>총 지출액 <strong>{Math.round(results.total).toLocaleString()}원</strong></span><span>1인 부담액 <strong>{Math.round(results.average).toLocaleString()}원</strong></span></div>
              <div className="transfer-list"><h4>최종 송금 내역</h4>{results.transfers.length ? results.transfers.map((transfer, index) => <div key={index}><span>{transfer.sender} <ArrowRight size={13} /> {transfer.receiver}</span><strong>{Math.round(transfer.amount).toLocaleString()}원</strong></div>) : <p>추가 송금이 필요하지 않습니다.</p>}</div>
            </div>
            <button className="secondary-button full-button" onClick={copyScreenshot}>{copied === 'loading' ? '이미지 생성 중...' : copied === true ? <><Check size={17} /> 복사 완료</> : copied === 'fallback' ? <><Download size={17} /> 저장 완료</> : <><Share size={17} /> 결과 이미지 공유</>}</button>
            <button className="text-button reset-button" onClick={reset}><RotateCcw size={15} /> 초기화</button>
          </>}
        </section>
      </div>
    </div>
  );
}
