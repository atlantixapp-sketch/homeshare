const { Server } = require('socket.io');
const { getUniqueName, clearDeviceName } = require('./device-names');

let io = null;
const connectedDevices = new Map();
const fileTransfers = new Map();

function initSocketServer(server) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: '/api/socketio',
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('✅ Dispositivo conectado:', socket.id);
    
    let deviceType = 'desktop';
    
    socket.on('device-info', (data) => {
      console.log(`📟 Dispositivo ${socket.id} es: ${data.type}`);
      deviceType = data.type;
      
      const deviceName = getUniqueName(socket.id);
      
      connectedDevices.set(socket.id, {
        id: socket.id,
        name: deviceName,
        connectedAt: new Date(),
        type: deviceType,
        userAgent: data.userAgent
      });

      console.log(`🎯 Asignado nombre: ${deviceName} a ${socket.id}`);
      broadcastDevicesUpdate();
    });

    const tempName = getUniqueName(socket.id);
    connectedDevices.set(socket.id, {
      id: socket.id,
      name: tempName,
      connectedAt: new Date(),
      type: deviceType,
      userAgent: 'Unknown'
    });

    broadcastDevicesUpdate();

    socket.on('start-file-transfer', (data) => {
      console.log('🚀 Iniciando transferencia:', data.filename, 'de', socket.id, 'a', data.targetId);
      
      if (!connectedDevices.has(data.targetId)) {
        socket.emit('transfer-error', { message: 'Dispositivo destino desconectado' });
        return;
      }

      fileTransfers.set(data.transferId, {
        filename: data.filename,
        size: data.size,
        from: socket.id,
        to: data.targetId,
        chunks: [],
        chunksReceived: 0,
        totalChunks: data.totalChunks
      });

      socket.to(data.targetId).emit('file-transfer-started', {
        transferId: data.transferId,
        filename: data.filename,
        size: data.size,
        from: socket.id,
        fromName: connectedDevices.get(socket.id)?.name || 'Dispositivo',
        totalChunks: data.totalChunks
      });

      socket.emit('transfer-progress', {
        transferId: data.transferId,
        percent: 0,
        status: 'Iniciando...'
      });
    });

    socket.on('file-chunk', (data) => {
      const transfer = fileTransfers.get(data.transferId);
      if (!transfer) return;

      try {
        socket.to(transfer.to).emit('file-chunk', {
          transferId: data.transferId,
          chunk: data.chunk,
          chunkIndex: data.chunkIndex,
          isLast: data.isLast
        });

        const percent = Math.round((data.chunkIndex / transfer.totalChunks) * 100);
        socket.emit('transfer-progress', {
          transferId: data.transferId,
          percent: percent,
          status: `Enviando... ${percent}%`
        });

      } catch (error) {
        console.error('❌ Error enviando chunk:', error);
        socket.emit('transfer-error', { 
          transferId: data.transferId,
          message: 'Error enviando archivo' 
        });
      }
    });

    socket.on('file-chunk-received', (data) => {
      const transfer = fileTransfers.get(data.transferId);
      if (!transfer) return;

      transfer.chunksReceived++;
      
      const percent = Math.round((transfer.chunksReceived / transfer.totalChunks) * 100);
      socket.to(transfer.from).emit('transfer-progress', {
        transferId: data.transferId,
        percent: percent,
        status: `Recibiendo... ${percent}%`
      });

      if (transfer.chunksReceived === transfer.totalChunks) {
        console.log('✅ Transferencia completada:', transfer.filename);
        
        socket.to(transfer.from).emit('transfer-complete', {
          transferId: data.transferId,
          filename: transfer.filename
        });

        socket.emit('transfer-complete', {
          transferId: data.transferId,
          filename: transfer.filename
        });

        setTimeout(() => {
          fileTransfers.delete(data.transferId);
        }, 5000);
      }
    });

    socket.on('transfer-error', (data) => {
      if (data.transferId) {
        const transfer = fileTransfers.get(data.transferId);
        if (transfer) {
          socket.to(transfer.from).emit('transfer-error', data);
          socket.to(transfer.to).emit('transfer-error', data);
          fileTransfers.delete(data.transferId);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Dispositivo desconectado:', socket.id, 'Razón:', reason);
      
      clearDeviceName(socket.id);
      connectedDevices.delete(socket.id);
      broadcastDevicesUpdate();
      
      for (const [transferId, transfer] of fileTransfers.entries()) {
        if (transfer.from === socket.id || transfer.to === socket.id) {
          fileTransfers.delete(transferId);
          const otherDevice = transfer.from === socket.id ? transfer.to : transfer.from;
          io.to(otherDevice).emit('transfer-error', {
            transferId: transferId,
            message: 'Dispositivo desconectado durante la transferencia'
          });
        }
      }
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  return io;
}

function broadcastDevicesUpdate() {
  if (!io) return;
  
  const devicesList = Array.from(connectedDevices.values());
  console.log('📱 Dispositivos conectados:', devicesList.length);
  
  devicesList.forEach(device => {
    console.log(`  - ${device.name} (${device.type}): ${device.id}`);
  });
  
  io.emit('devices-update', devicesList);
}

module.exports = { initSocketServer };