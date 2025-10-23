import React from "react";

interface FuriganaProps {
  word: string;
  reading: string;
  className?: string;
  show: boolean;
}

const Furigana: React.FC<FuriganaProps> = ({
  word,
  reading,
  className,
  show,
}) => {
  return (
    <ruby className={`select-none ${className}`}>
      {word}
      {show && <rt className="furigana-rt">{reading}</rt>}
    </ruby>
  );
};

export default Furigana;
