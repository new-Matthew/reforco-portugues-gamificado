import guideImage from "../../assets/personagem-tutorial.jpeg";
import { GUIDE_NAME } from "../../content/guide";

interface TeacherAvatarProps {
  readonly size?: number;
  readonly className?: string;
  readonly title?: string;
}

export function TeacherAvatar({
  size = 48,
  className,
  title = GUIDE_NAME,
}: TeacherAvatarProps) {
  const classes = ["teacher-avatar", "teacher-avatar__image", className]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      className={classes}
      src={guideImage}
      alt={title}
      width={size}
      height={size}
      draggable={false}
    />
  );
}
