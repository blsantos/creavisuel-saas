interface BackgroundVideoProps {
  src: string;
  position?: 'left' | 'right' | 'center' | 'bottom-left' | 'bottom-right';
  opacity?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const BackgroundVideo = ({ 
  src, 
  position = 'right', 
  opacity = 0.35, 
  size = 'md',
  className = ''
}: BackgroundVideoProps) => {
  const positionClasses = {
    left: 'left-0 top-1/2 -translate-y-1/2',
    right: 'right-0 top-1/2 -translate-y-1/2',
    center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'left-0 bottom-0',
    'bottom-right': 'right-0 bottom-0',
  };

  const sizeClasses = {
    sm: 'w-32 h-32 md:w-48 md:h-48',
    md: 'w-48 h-48 md:w-64 md:h-64',
    lg: 'w-64 h-64 md:w-80 md:h-80',
    xl: 'w-80 h-80 md:w-96 md:h-96',
  };

  return (
    <div 
      className={`absolute pointer-events-none z-0 overflow-hidden ${positionClasses[position]} ${className}`}
      style={{ opacity }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`${sizeClasses[size]} object-contain`}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
};

export default BackgroundVideo;
