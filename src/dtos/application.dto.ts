export interface ApplicationResponseDto {
    id: string;
    gigId: string;
    musicianId: string;
    coverLetter?: string;
    status: string;
    createdAt: string;
    musician?: {
        id: string;
        username?: string;
        email?: string;
        role?: string;
        stageName?: string;
        profilePicture?: string;
        instruments?: string[];
    };
    gig?: {
        id: string;
        title: string;
        location: {
            city: string;
            state: string;
            country: string;
        };
        payRate: number;
        eventType: string;
        genres: string[];
        instruments: string[];
        status: string;
    };
}

export interface CreateApplicationDto {
    gigId: string;
    coverLetter?: string;
}

export interface UpdateApplicationStatusDto {
    status: "accepted" | "rejected";
}
