import { BILL_BRANCHES } from '../../utils/categories';
import Field, { inputClass } from './Field';

// Branch picker shown only when a bill's category is Branches.
export default function BranchField({ category, value, onChange, disabled, className }) {
  if (category !== 'BRANCHES') return null;
  return (
    <Field label="Branch" className={className}>
      <select required className={inputClass} value={value ?? ''} onChange={onChange} disabled={disabled}>
        <option value="">— select branch —</option>
        {BILL_BRANCHES.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </Field>
  );
}
