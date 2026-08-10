import React, { useRef, useEffect, useCallback } from "react";
import "./AudioVisualizer.css";
import { usePlayer } from "../context/PlayerContext";

function AudioVisualizer({ isActive = true }) {
  const { analyserRef, isPlaying } = usePlayer();
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef?.current;
    if (!canvas || !analyser || !isPlaying || !isActive) return;

    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount; // 128
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const barCount = Math.min(64, bufferLength);
      const barWidth = (W / barCount) * 0.7;
      const gap = (W / barCount) * 0.3;

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i] / 255; // 0..1
        const barH = Math.max(3, value * H * 0.92);
        const x = i * (barWidth + gap);
        const y = H - barH;

        // Orange gradient with slight variation
        const alpha = 0.6 + value * 0.4;
        ctx.fillStyle = `rgba(255, ${Math.floor(100 + value * 60)}, 0, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
        ctx.fill();
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [analyserRef, isPlaying, isActive]);

  useEffect(() => {
    const cleanup = draw();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (cleanup) cleanup();
    };
  }, [draw]);

  // When not playing, clear canvas
  useEffect(() => {
    if (!isPlaying || !isActive) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw flat idle bars
        const W = canvas.width;
        const H = canvas.height;
        const barCount = 64;
        const barWidth = (W / barCount) * 0.7;
        const gap = (W / barCount) * 0.3;
        ctx.fillStyle = "rgba(255, 149, 0, 0.15)";
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap);
          ctx.beginPath();
          ctx.roundRect(x, H - 3, barWidth, 3, [2, 2, 0, 0]);
          ctx.fill();
        }
      }
    }
  }, [isPlaying, isActive]);

  return (
    <div className="audio-visualizer-wrapper">
      <canvas
        ref={canvasRef}
        className="audio-visualizer-canvas"
        width={300}
        height={100}
      />
    </div>
  );
}

export default AudioVisualizer;
