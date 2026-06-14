package com.lucky.server.util;
/**
 * @author shiningCloud2025
 */
public class AudioUtil {
    /**
     * 裸 PCM → 完整 WAV 字节数组
     * @param pcm     PCM 裸数据
     * @param sampleRate  采样率
     * @param bits        位深
     * @param channels    声道数
     */
    public static byte[] pcmToWav(byte[] pcm, int sampleRate, int bits, int channels) {
        /**
         * 辅助理解:
         * ┌──────────────────────────────────────────────┐
         * │  0-3    "RIFF"   资源交换文件标志              │
         * │  4-7    文件总大小-8 (小端序)                  │  ← 头部区
         * │  8-11   "WAVE"   WAV 格式标志                  │
         * ├──────────────────────────────────────────────┤
         * │  12-15  "fmt "   格式子块标志                   │
         * │  16-19  16       fmt 子块大小                  │
         * │  20-21  1        PCM 格式                     │  ← 格式区
         * │  22-23  1        声道数                        │
         * │  24-27  16000    采样率                        │
         * │  28-31  32000    字节率 (每秒字节数)            │
         * │  32-33  2        块对齐 (单次采样字节数)         │
         * │  34-35  16       位深                          │
         * ├──────────────────────────────────────────────┤
         * │  36-39  "data"   数据子块标志                   │  ← 数据区
         * │  40-43  N        数据大小                      │
         * ├──────────────────────────────────────────────┤
         * │  44...  裸 PCM 数据                           │  ← 你的音频
         * └──────────────────────────────────────────────┘
         */
        int dataSize = pcm.length;
        int totalSize = 36 + dataSize;
        byte[] wav = new byte[44 + dataSize];

        // RIFF 头
        wav[0] = 'R'; wav[1] = 'I'; wav[2] = 'F'; wav[3] = 'F';
        writeInt(wav, 4, totalSize);
        wav[8] = 'W'; wav[9] = 'A'; wav[10] = 'V'; wav[11] = 'E';

        // fmt 子块
        wav[12] = 'f'; wav[13] = 'm'; wav[14] = 't'; wav[15] = ' ';
        writeInt(wav, 16, 16);           // fmt chunk size = 16
        writeShort(wav, 20, 1);          // PCM = 1
        writeShort(wav, 22, channels);
        writeInt(wav, 24, sampleRate);
        writeInt(wav, 28, sampleRate * channels * bits / 8);
        writeShort(wav, 32, channels * bits / 8);  // block align
        writeShort(wav, 34, bits);

        // data 子块
        wav[36] = 'd'; wav[37] = 'a'; wav[38] = 't'; wav[39] = 'a';
        writeInt(wav, 40, dataSize);

        // 拷贝 PCM 数据
        System.arraycopy(pcm, 0, wav, 44, dataSize);
        return wav;
    }

    /**
     * 这是把 4 字节的 int 按小端序拆开写入的过程。
     *十六进制:  00 00 3E 80
     * 二进制:    00000000 00000000 00111110 10000000
     *           [  高字节  ] [  次高   ] [  次低   ] [  低字节 ]
     *              byte3        byte2        byte1       byte0
     * @param arr
     * @param offset
     * @param value
     */
    private static void writeInt(byte[] arr, int offset, int value) {
        /**
         * 辅助理解:
         * value = 16000    // = 0x00003E80
         *
         * value       = 00000000 00000000 00111110 10000000
         *  value & 0xFF 提取最低 8 位:
         *    (byte)(value)       → 10000000 → 0x80 = -128 (有符号)
         *    写到 arr[offset]
         *
         * value >> 8  = 00000000 00000000 00000000 00111110
         *    (byte)(value >> 8)  → 00111110 → 0x3E = 62
         *    写到 arr[offset+1]
         *
         * value >> 16 = 00000000 00000000 00000000 00000000
         *    (byte)(value >> 16) → 00000000 → 0x00 = 0
         *    写到 arr[offset+2]
         *
         * value >> 24 = 00000000 00000000 00000000 00000000
         *    (byte)(value >> 24) → 00000000 → 0x00 = 0
         *    写到 arr[offset+3]
         */
        arr[offset]     = (byte) (value);
        arr[offset + 1] = (byte) (value >> 8);
        arr[offset + 2] = (byte) (value >> 16);
        arr[offset + 3] = (byte) (value >> 24);
    }

    /**
     * writeShort 同理，只取 2 字节
     * @param arr
     * @param offset
     * @param value
     */
    private static void writeShort(byte[] arr, int offset, int value) {
        /**
         * 辅助理解:
         * value = 16  (位深)
         *
         * value      = 00000000 00010000
         * (byte)(value)      → 00010000 → 0x10 = 16    → arr[offset]
         * (byte)(value >> 8) → 00000000 → 0x00 = 0     → arr[offset+1]
         */
        arr[offset]     = (byte) (value);
        arr[offset + 1] = (byte) (value >> 8);
    }
}