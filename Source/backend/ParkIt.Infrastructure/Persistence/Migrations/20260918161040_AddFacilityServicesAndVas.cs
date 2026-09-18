using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParkIt.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFacilityServicesAndVas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FacilityId",
                table: "ServiceBookings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "FacilityServices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServiceType = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FacilityServices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FacilityServices_ParkingFacilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "ParkingFacilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceBookings_FacilityId",
                table: "ServiceBookings",
                column: "FacilityId");

            migrationBuilder.CreateIndex(
                name: "IX_FacilityServices_FacilityId_ServiceType",
                table: "FacilityServices",
                columns: new[] { "FacilityId", "ServiceType" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBookings_ParkingFacilities_FacilityId",
                table: "ServiceBookings",
                column: "FacilityId",
                principalTable: "ParkingFacilities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBookings_Users_UserId",
                table: "ServiceBookings",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBookings_ParkingFacilities_FacilityId",
                table: "ServiceBookings");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBookings_Users_UserId",
                table: "ServiceBookings");

            migrationBuilder.DropTable(
                name: "FacilityServices");

            migrationBuilder.DropIndex(
                name: "IX_ServiceBookings_FacilityId",
                table: "ServiceBookings");

            migrationBuilder.DropColumn(
                name: "FacilityId",
                table: "ServiceBookings");
        }
    }
}
