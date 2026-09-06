namespace ParkIt.Domain.Common;

/// <summary>Base type for all persisted entities. Uses GUID keys per the schema design.</summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
