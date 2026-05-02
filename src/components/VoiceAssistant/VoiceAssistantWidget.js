import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import VoiceWave from './VoiceWave';
import { SHADOWS } from '../../theme/theme';

const VoiceAssistantWidget = ({ onCommandProcessed }) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const recognitionRef = useRef(null);
  const voiceTimeoutRef = useRef(null);

  const stopAndProcessVoice = async (transcript) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }

    if (!transcript || transcript.trim() === '') {
      setIsVoiceActive(false);
      return;
    }

    setIsVoiceActive(false);
    setIsAiThinking(true);
    await onCommandProcessed(transcript.toLowerCase().trim());
    setIsAiThinking(false);
    setVoiceTranscript('');
  };

  const startVoiceAssistant = () => {
    if (Platform.OS !== 'web') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Voice Recognition. Please use Chrome.');
      return;
    }

    if (isVoiceActive && recognitionRef.current) {
      stopAndProcessVoice(voiceTranscript);
      return;
    }

    setIsVoiceActive(true);
    setVoiceTranscript('');

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // ITP-exact: accumulate full sentence, update immediately on every word
    recognition.onresult = (event) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setVoiceTranscript(fullTranscript);

      if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = setTimeout(() => {
        stopAndProcessVoice(fullTranscript);
      }, 1000); // Fast response: 1s after last word
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsVoiceActive(false);
      setVoiceTranscript('');
    };

    recognition.onend = () => {
      if (!voiceTimeoutRef.current) {
        setIsVoiceActive(false);
      }
    };

    recognition.start();

    voiceTimeoutRef.current = setTimeout(() => {
      stopAndProcessVoice('');
    }, 8000);
  };

  const labelText = isAiThinking
    ? 'Selecting best option...'
    : isVoiceActive
      ? (voiceTranscript ? `"${voiceTranscript}"` : 'Listening...')
      : 'Voice Assistant — Click to speak';

  return (
    <View style={[styles.voiceWidget, SHADOWS.medium]}>
      <View style={styles.voiceInner}>

        {/* Original wave - unchanged */}
        {(isVoiceActive || isAiThinking) && <VoiceWave isActive={true} />}

        {/* Transcript label */}
        <Text style={[styles.voiceLabel, (isVoiceActive || isAiThinking) && styles.voiceLabelActive]}>
          {labelText}
        </Text>

        {/* Original mic button - unchanged */}
        <TouchableOpacity
          style={[styles.micBtn, (isVoiceActive || isAiThinking) && styles.micBtnActive]}
          onPress={startVoiceAssistant}
        >
          <MaterialCommunityIcons
            name={(isVoiceActive || isAiThinking) ? 'microphone-off' : 'microphone'}
            size={32}
            color="#FFF"
          />
        </TouchableOpacity>

        {/* Tip chips - unchanged */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#B08974" />
            <Text style={styles.tipsHeaderText}>Try saying:</Text>
          </View>
          <View style={styles.chipsWrapper}>
            <View style={styles.chip1}><Text style={styles.chipText1}>"Nearest parking"</Text></View>
            <View style={styles.chip1}><Text style={styles.chipText1}>"Cheap parking"</Text></View>
            <View style={styles.chip2}><Text style={styles.chipText2}>"Near service center"</Text></View>
            <View style={styles.chip2}><Text style={styles.chipText2}>"Find inventory"</Text></View>
          </View>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  voiceWidget: {
    backgroundColor: '#FAF7F4',
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F0EBE6',
  },
  voiceInner: {
    alignItems: 'center',
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#B08974',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#B08974',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  micBtnActive: {
    backgroundColor: '#B26969',
  },
  voiceLabel: {
    fontSize: 14,
    color: '#738189',
    fontWeight: '500',
    marginVertical: 8,
    textAlign: 'center',
    minHeight: 20,
  },
  voiceLabelActive: {
    fontSize: 18,
    color: '#B08974',
    fontWeight: '800',
    fontStyle: 'italic',
  },
  tipsContainer: {
    marginTop: 14,
    alignItems: 'center',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsHeaderText: {
    color: '#9C8C79',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 13,
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip1: {
    backgroundColor: 'rgba(176, 137, 116, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(176, 137, 116, 0.2)',
  },
  chipText1: { color: '#B08974', fontSize: 12, fontWeight: '600' },
  chip2: {
    backgroundColor: 'rgba(176, 137, 116, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122, 128, 107, 0.2)',
  },
  chipText2: { color: '#7A806B', fontSize: 12, fontWeight: '600' },
});

export default VoiceAssistantWidget;
