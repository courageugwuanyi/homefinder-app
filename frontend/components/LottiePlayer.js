import { useEffect, useRef } from 'react';

const LottiePlayer = ({ src, loop = true, autoplay = true, style }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        let animationItem = null;

        const loadLottie = async () => {
            try {
                // Dynamic import of lottie-web
                const lottie = (await import('lottie-web')).default;

                if (containerRef.current) {
                    animationItem = lottie.loadAnimation({
                        container: containerRef.current,
                        renderer: 'svg',
                        loop,
                        autoplay,
                        path: src, // URL to your Lottie JSON file
                    });
                }
            } catch (error) {
                console.error('Failed to load Lottie animation:', error);
            }
        };

        loadLottie();

        return () => {
            if (animationItem) {
                animationItem.destroy();
            }
        };
    }, [src, loop, autoplay]);

    return <div ref={containerRef} style={style} />;
};

export default LottiePlayer;