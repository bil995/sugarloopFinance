import DispatchSheetForm from '../components/DispatchSheetForm';

export default function NonPerishablePage({ saleDate, onSaleDateChange, branch, onBranchChange }) {
  return (
    <DispatchSheetForm
      type="nonperishable"
      saleDate={saleDate}
      onSaleDateChange={onSaleDateChange}
      branch={branch}
      onBranchChange={onBranchChange}
    />
  );
}
