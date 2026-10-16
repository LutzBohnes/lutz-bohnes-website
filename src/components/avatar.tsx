type Props = { name: string; url?: string | null; size?: number; className?: string };

export function Avatar({ name, url, size = 40, className = "" }: Props) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={style} className={`flex-none rounded-full object-cover ${className}`} />;
  }
  return (
    <span style={style} className={`grid flex-none place-items-center rounded-full bg-primary/10 font-heading font-bold text-primary ${className}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
