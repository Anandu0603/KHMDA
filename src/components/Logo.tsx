import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return <img src="https://i.ibb.co/h1FQZp7q/kmdalogo.png" alt="KMDA Logo" className={`mx-auto rounded-full ${className}`} style={{ width: '120px', height: '120px' }} />;
};

export default Logo;
