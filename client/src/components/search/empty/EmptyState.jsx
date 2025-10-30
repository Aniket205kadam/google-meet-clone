import "./EmptyState.css";

const EmptyState = ({
  title = "No suggestions yet",
  message = "Start searching to find users or refresh to get recommendations.",
}) => {
  return (
    <div className="empty-state-container">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
