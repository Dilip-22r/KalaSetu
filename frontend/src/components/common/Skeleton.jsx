import "./Skeleton.css";

export const Skeleton = ({ className, style }) => (
  <div className={`skeleton-box ${className}`} style={style} />
);

export const PostSkeleton = () => (
  <div className="post-skeleton">
    <div className="post-skeleton-header">
      <Skeleton className="post-skeleton-avatar" />
      <div className="post-skeleton-info">
        <Skeleton className="post-skeleton-name" />
        <Skeleton className="post-skeleton-badge" />
      </div>
    </div>
    <Skeleton className="post-skeleton-image" />
    <Skeleton className="post-skeleton-title" />
    <Skeleton className="post-skeleton-content" />
    <Skeleton className="post-skeleton-content" style={{ width: "60%" }} />
    <div className="post-skeleton-actions">
      <Skeleton className="post-skeleton-action" />
      <Skeleton className="post-skeleton-action" />
      <Skeleton className="post-skeleton-action" />
    </div>
  </div>
);

export const ProfileCardSkeleton = () => (
  <div className="profile-card-skeleton">
    <Skeleton className="profile-card-skeleton-avatar" />
    <Skeleton className="profile-card-skeleton-name" />
    <Skeleton className="profile-card-skeleton-role" />
    <Skeleton className="profile-card-skeleton-detail" />
    <Skeleton className="profile-card-skeleton-detail" style={{ width: "90px", marginBottom: "20px" }} />
    <Skeleton className="profile-card-skeleton-btn" />
  </div>
);

export const ProfileHeaderSkeleton = () => (
  <div className="prof-header-skeleton">
    <Skeleton className="prof-cover-skeleton" />
    <div className="prof-body-skeleton">
      <Skeleton className="prof-avatar-skeleton" />
      <div className="prof-info-skeleton">
        <Skeleton className="prof-name-skeleton" />
        <Skeleton className="prof-meta-skeleton" />
        <Skeleton className="prof-meta-skeleton" style={{ width: "120px" }} />
      </div>
    </div>
  </div>
);
