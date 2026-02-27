import { GigRepository } from "../repositories/gig.repository";
import { ApplicationRepository } from "../repositories/application.repository";
import { MusicianRepository } from "../repositories/musician.repository";
import { OrganizerRepository } from "../repositories/organizer.repository";

export class DashboardService {
    private gigRepository: GigRepository;
    private applicationRepository: ApplicationRepository;
    private musicianRepository: MusicianRepository;
    private organizerRepository: OrganizerRepository;

    constructor() {
        this.gigRepository = new GigRepository();
        this.applicationRepository = new ApplicationRepository();
        this.musicianRepository = new MusicianRepository();
        this.organizerRepository = new OrganizerRepository();
    }

    async getMusicianDashboardStats(userId: string) {
        const musician = await this.musicianRepository.findByUserId(userId);
        if (!musician) return null;

        const musicianId = musician._id.toString();
        const applications = await this.applicationRepository.findByMusicianId(musicianId);

        const activeApplications = applications.filter(app => app.status === 'pending').length;
        const confirmedGigs = applications.filter(app => app.status === 'accepted').length;

        const recentGigs = applications
            .filter(app => app.status === 'accepted' || app.status === 'pending')
            .slice(0, 5)
            .map(app => {
                const gig = (app as any).gigId;
                return {
                    id: gig?._id?.toString() || app.gigId?.toString() || app._id.toString(),
                    title: gig?.title || "Unknown Gig",
                    status: app.status.charAt(0).toUpperCase() + app.status.slice(1),
                    date: app.createdAt ? app.createdAt.toLocaleDateString() : new Date().toLocaleDateString(),
                    location: gig?.location ? `${gig.location.city}, ${gig.location.state}` : "Unknown Location"
                };
            });

        return {
            stats: [
                { label: "Active Applications", value: activeApplications.toString(), icon: "FileText", color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Confirmed Gigs", value: confirmedGigs.toString(), icon: "Calendar", color: "text-purple-500", bg: "bg-purple-50" },
                { label: "Completion Rate", value: "100%", icon: "CheckCircle", color: "text-green-500", bg: "bg-green-50" },
                { label: "Profile Views", value: "0", icon: "TrendingUp", color: "text-orange-500", bg: "bg-orange-50" }
            ],
            recentGigs
        };
    }

    async getOrganizerDashboardStats(userId: string) {
        const organizer = await this.organizerRepository.findByUserId(userId);
        if (!organizer) return null;

        const organizerId = organizer._id.toString();

        // Find all gigs by this organizer
        const { gigs } = await this.gigRepository.findAll({ organizerId, page: 1, limit: 100 });

        // Stats aggregation
        const activeGigs = gigs.filter(gig => gig.status === 'open').length;

        // Fetch applications for all gigs to count total applicants
        // This is a bit heavy but fine for a start. 
        // We could optimize this by adding a countApplicationsByOrganizerId to the repository.
        let totalApplicants = 0;
        let recentApplications: any[] = [];

        for (const gig of gigs) {
            const apps = await this.applicationRepository.findByGigId(gig._id.toString());
            totalApplicants += apps.length;

            apps.forEach(app => {
                recentApplications.push({
                    id: (app._id as any).toString(),
                    name: (app as any).musicianId?.stageName || "Unknown Musician",
                    role: (app as any).musicianId?.instruments?.[0] || "Musician",
                    gig: gig.title,
                    status: app.status.charAt(0).toUpperCase() + app.status.slice(1),
                    musicianId: ((app as any).musicianId?._id || app.musicianId).toString()
                });
            });
        }

        // Sort by status or date? Let's say New first
        recentApplications.sort((a, b) => (a.status === 'Pending' ? -1 : 1)).slice(0, 5);

        return {
            stats: [
                { label: "Active Gigs", value: activeGigs.toString(), icon: "Briefcase", color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Total Applicants", value: totalApplicants.toString(), icon: "Users", color: "text-purple-500", bg: "bg-purple-50" },
                { label: "New Messages", value: "0", icon: "MessageSquare", color: "text-green-500", bg: "bg-green-50" },
                { label: "Success Rate", value: "100%", icon: "PieChart", color: "text-orange-500", bg: "bg-orange-50" }
            ],
            recentApplications: recentApplications.slice(0, 5)
        };
    }
}
