export const metadata = {
    title: "Board Game Meetup",
    description: "Find and host board game sessions in your community",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
