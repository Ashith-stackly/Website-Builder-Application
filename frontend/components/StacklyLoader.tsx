type StacklyLoaderProps = {
  fullScreen?: boolean;
  label?: string;
};

export default function StacklyLoader({ fullScreen = true, label = "Loading your workspace" }: StacklyLoaderProps) {
  return (
    <div className={fullScreen ? "stackly-loader-screen" : "stackly-loader-inline"} role="status" aria-live="polite">
      <div className="stackly-loader-card">
        <div className="stackly-loader-mark" aria-hidden="true">
          <span className="stackly-loader-bolt">S</span>
          <span className="stackly-loader-ring stackly-loader-ring-one" />
          <span className="stackly-loader-ring stackly-loader-ring-two" />
        </div>
        <div className="stackly-loader-copy">
          <p className="stackly-loader-brand">STACKLY</p>
          <p className="stackly-loader-label">{label}</p>
        </div>
        <div className="stackly-loader-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
