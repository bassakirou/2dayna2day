'use client';

interface VideoBlockProps {
  videoUrl: string;
  title?: string;
}

export default function VideoBlock({ videoUrl, title }: VideoBlockProps) {
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  
  let embedUrl = videoUrl;
  
  if (isYouTube) {
    // Convert YouTube URL to embed URL
    const videoId = videoUrl.includes('youtu.be')
      ? videoUrl.split('/').pop()
      : new URL(videoUrl).searchParams.get('v');
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  return (
    <section className="py-16 sm:py-24 bg-neutral-light">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-body font-heading mb-8">
            {title}
          </h2>
        )}
        
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl bg-black">
          {isYouTube ? (
            <iframe
              src={embedUrl}
              title={title || 'Vidéo produit'}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl}
              controls
              className="absolute inset-0 w-full h-full"
              poster="/images/video-poster.jpg"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}
        </div>
      </div>
    </section>
  );
}
