'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import io from 'socket.io-client'
import {
  Smartphone,
  Monitor,
  Tablet,
  Upload,
  Send,
  X,
  User,
  Wifi,
  WifiOff,
  Download,
  File,
  Check,
  Clock,
  Lock,
  Shield
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

// Tamaño de chunk (1MB)
const CHUNK_SIZE = 1024 * 1024;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Función para generar PIN de 4 dígitos
const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Función para detectar el tipo de dispositivo
const detectDeviceType = (userAgent) => {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  else if (/android/.test(ua)) return 'android';
  else return 'desktop';
};

// Función para obtener el nombre del dispositivo
const getDeviceName = (deviceType) => {
  switch (deviceType) {
    case 'ios': return 'iPhone';
    case 'android': return 'Android';
    case 'desktop': return 'Computadora';
    default: return 'Dispositivo';
  }
};

// Función para obtener el icono del dispositivo
const getDeviceIcon = (type) => {
  switch (type) {
    case "ios":
    case "android": return Smartphone;
    case "desktop": return Monitor;
    default: return Tablet;
  }
}

// Modal para PIN de seguridad usando Radix UI
const PinModal = ({ isOpen, onClose, onPinSubmit, fileInfo, senderInfo, pin }) => {
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState('');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconConfig = {
      pdf: { color: 'text-red-500', bg: 'bg-red-100' },
      doc: { color: 'text-blue-500', bg: 'bg-blue-100' },
      docx: { color: 'text-blue-500', bg: 'bg-blue-100' },
      txt: { color: 'text-gray-500', bg: 'bg-gray-100' },
      png: { color: 'text-orange-500', bg: 'bg-orange-100' },
      jpg: { color: 'text-yellow-500', bg: 'bg-yellow-100' },
      jpeg: { color: 'text-yellow-500', bg: 'bg-yellow-100' },
      gif: { color: 'text-purple-500', bg: 'bg-purple-100' },
      mp4: { color: 'text-indigo-500', bg: 'bg-indigo-100' },
      mov: { color: 'text-indigo-500', bg: 'bg-indigo-100' },
      mp3: { color: 'text-green-500', bg: 'bg-green-100' },
      zip: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
      rar: { color: 'text-yellow-600', bg: 'bg-yellow-100' }
    };
    return iconConfig[ext] || { color: 'text-gray-500', bg: 'bg-gray-100' };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputPin === pin) {
      onPinSubmit();
      setInputPin('');
      setError('');
    } else {
      setError('PIN incorrecto. Intenta nuevamente.');
    }
  };

  const handleClose = () => {
    setInputPin('');
    setError('');
    onClose();
  };

  const fileIcon = getFileIcon(fileInfo.filename);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" style={{ maxWidth: 450 }}>
          <div className="modal-header">
            <div className="modal-title-section">
              <div className="security-icon">
                <Shield size={20} />
              </div>
              <div>
                <Dialog.Title className="modal-title">
                  Archivo Protegido
                </Dialog.Title>
                <Dialog.Description className="modal-description">
                  Ingresa el PIN para descargar el archivo
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="modal-close-btn" onClick={handleClose}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="modal-body">
            {/* Información del archivo */}
            <div className="file-preview">
              <div className="file-preview-content">
                <div className={`file-icon ${fileIcon.bg} ${fileIcon.color}`}>
                  <File size={24} />
                </div>
                <div className="file-details">
                  <div className="file-name">{fileInfo.filename}</div>
                  <div className="file-meta">
                    {formatFileSize(fileInfo.size)} • {fileInfo.filename.split('.').pop().toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Información del remitente */}
            <div className="sender-info">
              <div className="sender-avatar">
                <User size={14} />
              </div>
              <div className="sender-details">
                <div className="sender-name">De: {senderInfo.name}</div>
                <div className="sender-device">{senderInfo.device}</div>
              </div>
            </div>

            {/* Formulario de PIN */}
            <form onSubmit={handleSubmit} className="pin-form">
              <div className="pin-input-container">
                <label className="pin-label">
                  <Lock size={16} />
                  PIN de seguridad (4 dígitos)
                </label>
                <input
                  type="password"
                  value={inputPin}
                  onChange={(e) => {
                    setInputPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setError('');
                  }}
                  className="pin-input"
                  placeholder="0000"
                  maxLength={4}
                  required
                />
                {error && <div className="pin-error">{error}</div>}
              </div>

              {/* Información de transferencia */}
              <div className="transfer-info">
                <div className="info-item">
                  <Clock size={14} />
                  <span>Tiempo estimado: {fileInfo.size > 10485760 ? '1-2 minutos' : '30-60 segundos'}</span>
                </div>
                <div className="info-item">
                  <Wifi size={14} />
                  <span>Transferencia segura por WiFi local</span>
                </div>
              </div>

              <div className="modal-actions">
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-secondary" onClick={handleClose}>
                    <X size={16} />
                    Cancelar
                  </button>
                </Dialog.Close>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={inputPin.length !== 4}
                >
                  <Download size={16} />
                  Verificar y Descargar
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <style jsx>{`
        .dialog-overlay {
          background: rgba(0, 0, 0, 0.5);
          position: fixed;
          inset: 0;
          animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1000;
        }

        .dialog-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90vw;
          max-width: 450px;
          max-height: 85vh;
          padding: 0;
          animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1001;
          overflow: hidden;
        }

        .dialog-content:focus {
          outline: none;
        }

        @keyframes overlayShow {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes contentShow {
          from {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px 24px 0;
        }

        .modal-title-section {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .security-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .modal-description {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0 0 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-body {
          padding: 24px;
        }

        .file-preview {
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 16px;
        }

        .file-preview-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-icon {
          padding: 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .file-details {
          flex: 1;
        }

        .file-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .file-meta {
          font-size: 12px;
          color: #6b7280;
        }

        .sender-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .sender-avatar {
          background: #e5e7eb;
          color: #6b7280;
          padding: 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sender-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sender-name {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .sender-device {
          font-size: 12px;
          color: #6b7280;
        }

        .pin-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .pin-input-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pin-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .pin-input {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
          text-align: center;
          letter-spacing: 8px;
          transition: all 0.2s;
        }

        .pin-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .pin-error {
          color: #ef4444;
          font-size: 14px;
          text-align: center;
          padding: 8px;
          background: #fef2f2;
          border-radius: 4px;
          border: 1px solid #fecaca;
        }

        .transfer-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }
      `}</style>
    </Dialog.Root>
  );
};

// El resto del código se mantiene igual...
export default function Home() {
  const [socket, setSocket] = useState(null)
  const [devices, setDevices] = useState([])
  const [myId, setMyId] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [transferStatus, setTransferStatus] = useState('')
  const [myDeviceType, setMyDeviceType] = useState('desktop')
  const [myDeviceName, setMyDeviceName] = useState('')
  
  // Estados para el sistema de PIN
  const [usePin, setUsePin] = useState(false)
  const [transferPin, setTransferPin] = useState('')
  const [incomingFile, setIncomingFile] = useState(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingTransfer, setPendingTransfer] = useState(null)

  const fileInputRef = useRef(null)
  const incomingFilesRef = useRef(new Map())
  const devicesRef = useRef(devices)
  const socketRef = useRef(null)

  // Actualizar ref cuando devices cambie
  useEffect(() => {
    devicesRef.current = devices
  }, [devices])

  // Función para procesar actualización de dispositivos
  const processDevicesUpdate = useCallback((deviceList, currentSocketId) => {
    if (!currentSocketId) return;

    const uniqueDevices = deviceList.reduce((acc, device) => {
      if (device.id === currentSocketId) return acc;
      if (!acc.find(d => d.id === device.id)) acc.push(device);
      return acc;
    }, []);

    const myDevice = deviceList.find(device => device.id === currentSocketId)
    if (myDevice) setMyDeviceName(myDevice.name);

    setDevices(prevDevices => {
      if (JSON.stringify(prevDevices) !== JSON.stringify(uniqueDevices)) {
        return uniqueDevices
      }
      return prevDevices
    })
  }, [])

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const deviceType = detectDeviceType(userAgent);
    setMyDeviceType(deviceType);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const newSocket = io({
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      timeout: 60000,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ CONECTADO - ID:', newSocket.id)
      setIsConnected(true);
      setMyId(newSocket.id);
      setConnectionError('');

      newSocket.emit('device-info', {
        type: deviceType,
        userAgent: userAgent,
        timestamp: Date.now()
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ DESCONECTADO')
      setIsConnected(false);
      setMyId('');
      setDevices([]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ ERROR CONEXIÓN:', error)
      setConnectionError(`Error de conexión: ${error.message}`);
      setDevices([]);
    });

    newSocket.on('devices-update', (deviceList) => {
      processDevicesUpdate(deviceList, newSocket.id);
    });

    // Receptor: Notificación de nueva transferencia con PIN
    newSocket.on('file-transfer-started', (data) => {
      console.log('📥 Nueva transferencia con PIN:', data);

      if (incomingFilesRef.current.has(data.transferId)) {
        console.log('⚠️ Transferencia duplicada, ignorando')
        return;
      }

      const fileData = {
        filename: data.filename,
        size: data.size,
        chunks: [],
        totalChunks: data.totalChunks,
        receivedChunks: 0
      };

      incomingFilesRef.current.set(data.transferId, fileData);

      setIncomingFile({
        filename: data.filename,
        size: data.size,
        fromName: data.fromName,
        fromDevice: getDeviceName(data.fromType)
      });

      setPendingTransfer({
        transferId: data.transferId,
        socket: newSocket,
        requiresPin: data.requiresPin,
        pin: data.pin
      });

      console.log('🔄 Mostrando modal de PIN...', data.requiresPin)

      if (data.requiresPin) {
        setShowPinModal(true);
        setTransferStatus(`Archivo protegido: ${data.filename} - Esperando PIN`);
      } else {
        // Si no requiere PIN, aceptar automáticamente
        console.log('✅ Aceptando transferencia sin PIN')
        handleAcceptTransfer();
      }
    });

    // Resto de event listeners...
    newSocket.on('file-chunk', async (data) => {
      const fileData = incomingFilesRef.current.get(data.transferId);
      if (!fileData) {
        console.log('❌ Transferencia no encontrada:', data.transferId)
        return;
      }

      try {
        if (fileData.chunks[data.chunkIndex]) {
          console.log('⚠️ Chunk duplicado, ignorando:', data.chunkIndex)
          return;
        }

        fileData.chunks[data.chunkIndex] = data.chunk;
        fileData.receivedChunks++;

        newSocket.emit('file-chunk-received', {
          transferId: data.transferId,
          chunkIndex: data.chunkIndex
        });

        const percent = Math.round((fileData.receivedChunks / fileData.totalChunks) * 100);
        setProgress(percent);
        setTransferStatus(`Recibiendo ${fileData.filename}: ${percent}%`);

        if (data.isLast || fileData.receivedChunks === fileData.totalChunks) {
          console.log('✅ Todos los chunks recibidos, reconstruyendo archivo...')
          await reconstructAndDownloadFile(fileData, data.transferId);
          setTransferStatus(`✅ ${fileData.filename} recibido exitosamente!`);
          setTimeout(() => setTransferStatus(''), 3000);
          setProgress(0);
          incomingFilesRef.current.delete(data.transferId);
        }

      } catch (error) {
        console.error('❌ Error procesando chunk:', error);
        newSocket.emit('transfer-error', {
          transferId: data.transferId,
          message: 'Error procesando archivo'
        });
        setTransferStatus('❌ Error recibiendo archivo');
        setProgress(0);
        incomingFilesRef.current.delete(data.transferId);
        setTimeout(() => setTransferStatus(''), 3000);
      }
    });

    newSocket.on('transfer-progress', (data) => {
      setProgress(data.percent);
      setTransferStatus(data.status);
    });

    newSocket.on('transfer-complete', (data) => {
      setTransferStatus(`✅ ${data.filename} enviado exitosamente!`);
      setTimeout(() => setTransferStatus(''), 3000);
      setProgress(0);
      resetFile();
    });

    newSocket.on('transfer-error', (data) => {
      setTransferStatus(`❌ Error: ${data.message}`);
      setTimeout(() => setTransferStatus(''), 3000);
      setProgress(0);
      if (data.transferId) {
        incomingFilesRef.current.delete(data.transferId);
      }
    });

    return () => {
      console.log('🧹 Limpiando socket...')
      if (newSocket.connected) newSocket.disconnect();
      setDevices([]);
    };
  }, [processDevicesUpdate]);

  // Manejar aceptación de transferencia (con o sin PIN)
  const handleAcceptTransfer = () => {
    if (pendingTransfer) {
      const { transferId, socket } = pendingTransfer;
      
      console.log('✅ Aceptando transferencia:', transferId)
      
      socket.emit('file-chunk-received', {
        transferId: transferId,
        chunkIndex: 0
      });
      
      setTransferStatus(`Preparado para recibir: ${incomingFile.filename}`);
      setShowPinModal(false);
      setIncomingFile(null);
      setPendingTransfer(null);
    }
  };

  // Manejar verificación de PIN
  const handlePinSubmit = () => {
    console.log('✅ PIN correcto, aceptando transferencia')
    handleAcceptTransfer();
  };

  // Manejar rechazo de archivo
  const handleRejectFile = () => {
    if (pendingTransfer) {
      const { transferId, socket } = pendingTransfer;
      
      console.log('❌ Rechazando transferencia:', transferId)
      
      socket.emit('transfer-error', {
        transferId: transferId,
        message: 'Rechazado por el usuario'
      });
      
      incomingFilesRef.current.delete(transferId);
      setTransferStatus('Transferencia rechazada');
      setTimeout(() => setTransferStatus(''), 3000);
      setShowPinModal(false);
      setIncomingFile(null);
      setPendingTransfer(null);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        alert('❌ Archivo muy grande. Máximo 20MB.');
        return;
      }
      setSelectedFile(file);
      setProgress(0);
      setTransferStatus('');
    }
  };

  const sendFile = async (targetId) => {
    if (!selectedFile || !socket || !isConnected) {
      alert('❌ No hay archivo seleccionado o no estás conectado');
      return;
    }

    if (!targetId) {
      alert('❌ No se seleccionó dispositivo destino');
      return;
    }

    console.log('🚀 Iniciando envío a:', targetId)

    try {
      const fileBuffer = await readFileAsArrayBuffer(selectedFile);
      const totalChunks = Math.ceil(fileBuffer.byteLength / CHUNK_SIZE);
      const transferId = `${myId}-${Date.now()}`;
      
      // Generar PIN si está activado
      const pin = usePin ? generatePin() : null;

      setTransferStatus(`Preparando envío de ${selectedFile.name}...`);
      setProgress(5);

      // Iniciar transferencia con información de PIN
      socket.emit('start-file-transfer', {
        targetId: targetId,
        filename: selectedFile.name,
        size: selectedFile.size,
        totalChunks: totalChunks,
        transferId: transferId,
        fromName: myDeviceName,
        fromType: myDeviceType,
        requiresPin: usePin,
        pin: pin
      });

      console.log('📤 Transferencia iniciada con PIN:', usePin)

      // Mostrar PIN al usuario si está habilitado
      if (usePin) {
        setTransferPin(pin);
        alert(`🔒 Archivo protegido con PIN: ${pin}\n\nComparte este PIN con el destinatario para que pueda descargar el archivo.`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      for (let i = 0; i < totalChunks; i++) {
        if (!socket.connected) {
          throw new Error('Conexión perdida durante la transferencia');
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileBuffer.byteLength);
        const chunk = fileBuffer.slice(start, end);
        const chunkArray = Array.from(new Uint8Array(chunk));

        socket.emit('file-chunk', {
          transferId: transferId,
          chunk: chunkArray,
          chunkIndex: i,
          isLast: i === totalChunks - 1
        });

        const sendingPercent = Math.round((i / totalChunks) * 100);
        setProgress(sendingPercent);
        setTransferStatus(`Enviando ${selectedFile.name}: ${sendingPercent}%`);

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      console.log('✅ Todos los chunks enviados')

    } catch (error) {
      console.error('❌ Error en transferencia:', error);
      alert(`❌ Error enviando archivo: ${error.message}`);
      setProgress(0);
      setTransferStatus('');
    }
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const reconstructAndDownloadFile = async (fileData, transferId) => {
    try {
      console.log('🔨 Reconstruyendo archivo...')

      const totalSize = fileData.chunks.reduce((total, chunk) => total + (chunk ? chunk.length : 0), 0);
      const mergedArray = new Uint8Array(totalSize);
      let offset = 0;

      for (let i = 0; i < fileData.chunks.length; i++) {
        if (fileData.chunks[i]) {
          mergedArray.set(new Uint8Array(fileData.chunks[i]), offset);
          offset += fileData.chunks[i].length;
        }
      }

      const blob = new Blob([mergedArray]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Archivo descargado:', fileData.filename)

    } catch (error) {
      console.error('❌ Error reconstruyendo archivo:', error);
      alert('❌ Error al reconstruir el archivo recibido');
      throw error;
    }
  };

  const resetFile = () => {
    setSelectedFile(null);
    setProgress(0);
    setTransferStatus('');
    setUsePin(false);
    setTransferPin('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const DeviceIcon = getDeviceIcon(myDeviceType);

  return (
    <div className="main-wrapper">
      <div className="container">
        <div className="header-section">
          <h1>🏠 HomeShare</h1>
          <p>Comparte archivos al instante entre dispositivos en tu misma red local</p>
        </div>

        {/* Status Card */}
        <div className={`status-card ${isConnected ? "connected" : "disconnected"}`}>
          <div className="status-content">
            <div className="status-indicator">
              <div className={`status-dot ${isConnected ? "connected" : "disconnected"}`}></div>
              <div className="status-text">
                <h2>{isConnected ? "Conectado a la red local" : "Desconectado"}</h2>
                {myDeviceName && (
                  <div className="device-name">
                    <DeviceIcon size={16} />
                    {myDeviceName}
                  </div>
                )}
              </div>
            </div>

            <div className={`badge ${isConnected ? "success" : "danger"}`}>
              {isConnected ? (
                <>
                  <Wifi size={16} />
                  {devices.length} dispositivos conectados
                </>
              ) : (
                <>
                  <WifiOff size={16} />
                  Sin conexión
                </>
              )}
            </div>
          </div>

          {connectionError && (
            <div className="error-alert">
              <strong>⚠️ Error:</strong> {connectionError}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="content-grid">
          {/* Devices List */}
          <div className="card">
            <div className="card-header">
              <h3>📱 Otros Dispositivos</h3>
            </div>
            <div className="card-content">
              {devices.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <h3>No hay otros dispositivos</h3>
                  <p>Abre HomeShare en otros dispositivos de tu WiFi</p>
                </div>
              ) : (
                <div className="devices-grid">
                  {devices.map((device) => {
                    const DeviceIcon = getDeviceIcon(device.type);
                    return (
                      <div key={device.id} className="device-card">
                        <div className={`device-icon ${device.type}`}>
                          <DeviceIcon size={24} color="white" />
                        </div>
                        <h4 className="device-name-text">{device.name}</h4>
                        <span className="device-type">{getDeviceName(device.type)}</span>
                        <span className="device-time">
                          Conectado: {new Date(device.connectedAt).toLocaleTimeString()}
                        </span>
                        <button
                          onClick={() => sendFile(device.id)}
                          disabled={!selectedFile || !isConnected}
                          className="btn btn-primary btn-full"
                        >
                          <Send size={16} />
                          Enviar Archivo
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* File Transfer Section */}
          <div className="card file-transfer-card">
            <div className="card-header">
              <h3>📁 Enviar Archivo</h3>
            </div>
            <div className="card-content upload-content">
              {/* Configuración de seguridad */}
              <div className="security-settings">
                <div className="security-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={usePin}
                      onChange={(e) => setUsePin(e.target.checked)}
                      className="toggle-input"
                    />
                    <div className="toggle-slider"></div>
                    <div className="toggle-text">
                      <Shield size={16} />
                      Proteger con PIN
                    </div>
                  </label>
                  <span className="toggle-description">
                    El destinatario necesitará un PIN para descargar el archivo
                  </span>
                </div>
              </div>

              <div className="upload-zone">
                <input
                  id="file-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden-file-input"
                />
                <label htmlFor="file-input" className="upload-label">
                  <div className="upload-icon-container">
                    <Upload size={40} />
                  </div>
                  <h4 className="upload-title">
                    {selectedFile ? "Archivo Seleccionado ✓" : "Arrastra tu archivo aquí"}
                  </h4>
                  <p className="upload-subtitle">
                    {selectedFile ? selectedFile.name : "o haz clic para seleccionar"}
                  </p>
                  <p className="upload-hint">Máximo 20MB</p>
                </label>
              </div>

              {selectedFile && (
                <div className="file-info premium">
                  <div className="file-icon">
                    <div className="icon-bg"></div>
                  </div>
                  <div className="file-details-premium">
                    <h4>{selectedFile.name}</h4>
                    <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    {usePin && (
                      <div className="security-badge">
                        <Shield size={12} />
                        Protegido con PIN
                      </div>
                    )}
                  </div>
                  <button onClick={resetFile} className="btn-clear">
                    <X size={18} />
                  </button>
                </div>
              )}

              {(transferStatus || progress > 0) && (
                <div className="progress-container premium">
                  <div className="progress-status">
                    <span className="status-dot-mini"></span>
                    <p className="progress-text">{transferStatus}</p>
                  </div>
                  <div className="progress-wrapper">
                    <div className="progress-bar-bg">
                      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (devices.length > 0) sendFile(devices[0].id)
                  else alert("No hay otros dispositivos conectados")
                }}
                disabled={!selectedFile || !isConnected || devices.length === 0}
                className="btn btn-send"
              >
                <div className="btn-content">
                  <Upload size={20} />
                  <span>{devices.length === 0 ? "Sin dispositivos" : "Enviar Archivo"}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para PIN de seguridad */}
      <PinModal
        isOpen={showPinModal}
        onClose={handleRejectFile}
        onPinSubmit={handlePinSubmit}
        fileInfo={incomingFile || { filename: '', size: 0 }}
        senderInfo={{
          name: incomingFile?.fromName || 'Usuario',
          device: incomingFile?.fromDevice || 'Dispositivo'
        }}
        pin={pendingTransfer?.pin || ''}
      />

      {/* Estilos adicionales */}
      <style jsx>{`
        .security-settings {
          margin-bottom: 20px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .security-toggle {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          position: relative;
        }

        .toggle-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          width: 44px;
          height: 24px;
          background: #cbd5e0;
          border-radius: 24px;
          position: relative;
          transition: all 0.3s;
        }

        .toggle-slider:before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          top: 3px;
          left: 3px;
          transition: all 0.3s;
        }

        .toggle-input:checked + .toggle-slider {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .toggle-input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .toggle-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .toggle-description {
          font-size: 12px;
          color: #6b7280;
          margin-left: 56px;
        }

        .security-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ecfdf5;
          color: #065f46;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};