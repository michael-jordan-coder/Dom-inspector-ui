import { useState } from 'react';

export function ThrowingDemo() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep((s) => s + 1);
  };

  if (step >= 2) {
    throw new Error(`Demo crash after interaction chain for ${name || 'anonymous'}`);
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <p>Interaction chain: type a name, submit, click trigger again.</p>
      <form onSubmit={onSubmit}>
        <input value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} placeholder="type to generate input events" />
        <button type="submit" style={{ marginLeft: 8 }}>Advance</button>
      </form>
      <button onClick={() => setStep((s) => s + 1)}>Trigger final step</button>
      <div>Current step: {step}</div>
    </div>
  );
}
