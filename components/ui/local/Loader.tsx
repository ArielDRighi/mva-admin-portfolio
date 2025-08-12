import React from "react";

const Loader = ({ className }: { className?: string }) => {
  return (
    <div className={`three-body z-10 ${className}`}>
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
    </div>
  );
};

export default Loader;
