// const {connection_code} = require("../../models");
const {connection_code} = require("../models")
const {Server} =require("socket.io");
const Sequelize = require('sequelize');
let io
function createSocketServer(httpServer) {
     io = new Server(httpServer, {
        cors: {
          // origin: 'http://localhost:8100',
          origin: ['http://165.22.222.20','http://localhost:8101','http://localhost:8100','http://localhost:8102','http://localhost:8103','http://192.168.251.85:8102','http://localhost','https://localhost','http://192.168.29.212:8102'],
          methods: ['GET', 'POST'],
          credentials: true,
        },
      });
      console.log("connection---")
      io.on('connection', (socket) => {    //socket-cleint
          console.log("-----------------NEW---------------------")
          console.log('New Client connected',socket.id);                 
            // Connecting Code start
            socket.on('start_connection', async (info) => {
              console.log(`start_connection -org_id ${info.org_id} code-${info.unique}`);
              const responseEvent1 = `connection_ready_${info.unique}`
            // info.unique;
            // console.log("responseEvent1",responseEvent1)
              try {
                let NewCode = await connection_code.create({
                    org_id: info.org_id,
                    socket_id: socket.id,
                    code: `${info.unique}`,
                    status: '0',
                  });
                let detail={
                  NewCode:NewCode,
                  info:info,
                  ms:'Conection Ready',
                  conection:true
                }
                  io.to(socket.id).emit(responseEvent1,detail );
                //   io.emit(responseEvent1, `unique ID111: ${info.unique}`,'info',info.bussinessId);
              } catch (error) {
                let detail={
                  NewCode:{},
                  ms:error,
                  conection:false
                }
                io.to(socket.id).emit(responseEvent1,detail );
                console.log('error',error);
              }
              // socket.emit(responseEvent, 'Client Response aya hai MIYA....');
            }); 
            // Connecting Code END 
            // cashier connection start
            socket.on('cashierConnection', async (cashierinfo) => {
                const responseEvent1 = `receive_Bussness_Response${cashierinfo.unique}`;
                // console.log(`cashierConnection ID: ${cashierinfo.unique}`);
                 // First, find the row that you want to update
              // Check start 
              try {
                const rowToDelete = await connection_code.findOne({
                  where: {
                    cashier_id:cashierinfo.cashier_id,
                  },
                });
                  // Delete the record where socket_id matches a specific value
                  if(rowToDelete && rowToDelete.connection_route && rowToDelete.code !=cashierinfo.unique)
                  {
                    let info={
                      conection:false,
                      reset:true,
                      status:0,
                      ms:'Connection needs to reset'
                    }
                    io.emit(rowToDelete.connection_route,info);
                    let data = await connection_code.destroy({
                      where: {
                        cashier_id:cashierinfo.cashier_id,
                      },
                      returning: true,
                    });
                    console.log('cashier deleted data',data);
                    console.log('cashir OLD connection');
                  }
                  connection_code.findOne({
                    where: {
                      code: cashierinfo.unique
                    }
                  })
                    .then((rowToUpdate) => {
                      if (rowToUpdate && rowToUpdate.code) {
                        // Update the status
                        return rowToUpdate.update(
                          {
                             status: '1' ,
                             connection_route: responseEvent1,
                             cashier_id:cashierinfo.cashier_id
                            } 
                        );
                      } else {
                        let updatedRow={
                          ms:'Not Found',
                          status:'0',
                          reset:true
                        }
                        io.emit(responseEvent1,updatedRow);
                        io.to(socket.id).emit('receive_Bussness', `Server received Bussiness ID: ${cashierinfo.unique}`);
                        console.log('Row not found.');
                      }
                    })
                    .then((updatedRow) => {
                      if (updatedRow) {
                        console.log('Updated row data:', updatedRow.toJSON());
                        console.log('Updated row data:', updatedRow);
                        const responseEvent = `response-${cashierinfo.unique}`;
                        
                        io.emit(responseEvent1,updatedRow);
                        io.to(socket.id).emit('receive_Bussness', `Server received Bussiness ID: ${cashierinfo.unique}`);
                      }
                    })
                    .catch((error) => {
                      console.error(error);
                    });

                } catch (error) {
                  console.error('Error deleting record:', error);
                }
              // Check END  
                // Send a response back to the client on the specific event associated with the bussinessId
              
                
              });
              socket.on('checkConnectionCode',async(connectioninfo)=>{
                if(connectioninfo && connectioninfo.code)
                {
                  console.log('checkConnectionCode',connectioninfo)
                const rowToDelete = await connection_code.findOne({
                  where: {
                    code: connectioninfo.code,
                  },
                });
                if(rowToDelete)
                {
                  const responseEvent1 = `instruction_${rowToDelete.code}`;
                  let info={
                    conection:true,
                    reset:false,
                    status:1,
                    cashierLogout:false,
                    ms:'Connection Code Is Available'
                  }
                  io.emit(responseEvent1,info);
                }else{
                  const responseEvent1 = `instruction_${connectioninfo.code}`;
                  let info={
                    conection:false,
                    reset:true,
                    status:0,
                    cashierLogout:true,
                    ms:'Connection needs to reset'
                  }
                  io.emit(responseEvent1,info);
                }
                }else{
                  const responseEvent1 = `instruction_${connectioninfo.code}`;
                  let info={
                    conection:false,
                    reset:true,
                    status:0,
                    cashierLogout:true,
                    ms:'Connection needs to reset'
                  }
                  io.emit(responseEvent1,info);
                }
              })
              socket.on('sendBussnessResponse', (info)=> {
              console.log(`sendBussnessResponse ${info}`);
              const responseEvent = `receive_Bussness_Response_${info.bussnessId}`;
              console.log("responseEvent",responseEvent)
              socket.emit(responseEvent, 'Client Response aya hai MIYA....');
              io.to(socket.id).emit('receive_Bussness_Response', `Bussiness ID: ${info.bussnessId}`,'info',info);
              io.emit(responseEvent, info);
              io.emit('responseEvent', info);
            });
            socket.on('endtransaction', (info)=> {
              const responseEvent = `instruction_${info.bussnessId}`;
              io.emit(responseEvent, info);
              // io.emit('jk47', info);
            })
            // cashier connection end
        // END
          // Event handler when a client disconnects
          socket.on('disconnect', async () => {
            console.log('Client disconnected',socket.id);
            try {
              const rowToDelete = await connection_code.findOne({
                where: {
                  socket_id: socket.id,
                  status: {
                      [Sequelize.Op.ne]: '1', // Op.ne stands for "not equal"
                    },
                },
              });
                // Delete the record where socket_id matches a specific value
                if(rowToDelete)
                {
                  let data = await connection_code.destroy({
                    where: {
                      socket_id: socket.id,
                      status: {
                          [Sequelize.Op.ne]: '1', // Op.ne stands for "not equal"
                        },
                    },
                    returning: true,
                  });
                  console.log(data);
                  if(data>0)
                  {
                    console.log(`Record ${data} deleted successfully`);
                    const responseEvent1 = `receive_Bussness_Response${rowToDelete.code}`;
                    let info={
                      conection:false,
                      reset:true,
                      status:0,
                      ms:'Connection needs to reset'
                    }
                    io.emit(responseEvent1,info);
                  }
                  console.log('data',data);
                }
              } catch (error) {
                console.error('Error deleting record:', error);
              }
              
          });
        });
}

async function SendmsToclient(info,rowToDelete)
{
  console.log('info from SendmsToclient',info);
  if(info.conection==false)
  {
    let info={
      conection:false,
      reset:true,
      status:0,
      cashierLogout:true,
      ms:'cashier login on diffrenet divise'
    }
    if(rowToDelete && rowToDelete.connection_route)
    {
      // let rowToDelete= rowToDelete.connection_route
      // info.bussnessId= rowToDelete.code
      // io.emit(rowToDelete.connection_route,info);
      const responseEvent = `instruction_${rowToDelete.code}`;
      io.emit(responseEvent, info);
      let data = await connection_code.destroy({
        where: {
          cashier_id:rowToDelete.cashier_id,
        },
        returning: true,
      });
      console.log('cashier deleted data',data);
      console.log('cashir OLD connection');
    }
  }
}

  module.exports = { createSocketServer,SendmsToclient };