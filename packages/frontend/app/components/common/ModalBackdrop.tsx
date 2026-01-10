interface ModalBackdropProps {
  onClose: () => void;
}

const ModalBackdrop: React.FC<ModalBackdropProps> = ({ onClose }) => (
  <div
    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
    onClick={onClose}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Escape") onClose();
    }}
    aria-label="Close modal"
  />
);

export default ModalBackdrop;