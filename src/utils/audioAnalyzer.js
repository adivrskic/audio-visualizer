export class AudioAnalyzer {
  constructor(audioContext, fftSize = 2048) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  connect(source) {
    source.connect(this.analyser);
  }

  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getTimeDomainData() {
    this.analyser.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }

  getWaveformData(samples = 128) {
    const data = this.getTimeDomainData();
    const chunkSize = Math.floor(this.bufferLength / samples);
    const waveform = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < chunkSize; j++) {
        sum += data[i * chunkSize + j];
      }
      waveform.push(sum / chunkSize / 128);
    }

    return waveform;
  }
}
