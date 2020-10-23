import React, {Component} from 'react';
import {ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    View,
    Button,
    ScrollView,
    DeviceEventEmitter,
    NativeEventEmitter,
    Switch,
    TouchableOpacity,
    Dimensions,
    ToastAndroid} from 'react-native';
import {BluetoothEscposPrinter, BluetoothManager, BluetoothTscPrinter} from "react-native-bluetooth-escpos-printer";
//import EscPos from "./escpos";
//import Tsc from "./tsc";

var {height, width} = Dimensions.get('window');
export default class Home extends Component {


    _listeners = [];

    constructor(props) {
        super(props);
        this.state = {
            devices: null,
            pairedDs:[],
            foundDs: [],
            bleOpend: false,
            loading: true,
            boundAddress: '',
            debugMsg: ''
        }
    }

    componentDidMount() {
        BluetoothManager.isBluetoothEnabled().then((enabled)=> {
            this.setState({
                bleOpend: Boolean(enabled),
                loading: false
            })
        }, (err)=> {
            err
        });

        if (Platform.OS === 'ios') {
            let bluetoothManagerEmitter = new NativeEventEmitter(BluetoothManager);
            this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
                (rsp)=> {
                    this._deviceAlreadPaired(rsp)
                }));
            this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, (rsp)=> {
                this._deviceFoundEvent(rsp)
            }));
            this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, ()=> {
                this.setState({
                    name: '',
                    boundAddress: ''
                });
            }));
        } else if (Platform.OS === 'android') {
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, (rsp)=> {
                    this._deviceAlreadPaired(rsp)
                }));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_DEVICE_FOUND, (rsp)=> {
                    this._deviceFoundEvent(rsp)
                }));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_CONNECTION_LOST, ()=> {
                    this.setState({
                        name: '',
                        boundAddress: ''
                    });
                }
            ));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT, ()=> {
                    ToastAndroid.show("Device Not Support Bluetooth !", ToastAndroid.LONG);
                }
            ))
        }
    }

    _deviceAlreadPaired(rsp) {
        var ds = null;
        if (typeof(rsp.devices) == 'object') {
            ds = rsp.devices;
        } else {
            try {
                ds = JSON.parse(rsp.devices);
            } catch (e) {
            }
        }
        if(ds && ds.length) {
            let pared = this.state.pairedDs;
            pared = pared.concat(ds||[]);
            this.setState({
                pairedDs:pared
            });
        }
    }

    _deviceFoundEvent(rsp) {//alert(JSON.stringify(rsp))
        var r = null;
        try {
            if (typeof(rsp.device) == "object") {
                r = rsp.device;
            } else {
                r = JSON.parse(rsp.device);
            }
        } catch (e) {//alert(e.message);
            //ignore
        }
        //alert('f')
        if (r) {
            let found = this.state.foundDs || [];
            if(found.findIndex) {
                let duplicated = found.findIndex(function (x) {
                    return x.address == r.address
                });
                //CHECK DEPLICATED HERE...
                if (duplicated == -1) {
                    found.push(r);
                    this.setState({
                        foundDs: found
                    });
                }
            }
        }
    }

    _renderRow(rows){
        let items = [];
        for(let i in rows){
            let row = rows[i];
            if(row.address) {
                items.push(
                    <TouchableOpacity key={new Date().getTime()+i} style={styles.wtf} onPress={()=>{
                    this.setState({
                        loading:true
                    });
                    BluetoothManager.connect(row.address)
                        .then((s)=>{
                            this.setState({
                                loading:false,
                                boundAddress:row.address,
                                name:row.name || "UNKNOWN"
                            })
                        },(e)=>{
                            this.setState({
                                loading:false
                            })
                            alert(e);
                        })

                }}><Text style={styles.name}>{row.name || "UNKNOWN"}</Text><Text
                        style={styles.address}>{row.address}</Text></TouchableOpacity>
                );
            }
        }
        return items;
    }

    render() {
        return (
            <ScrollView style={styles.container}>
                <Text>{this.state.debugMsg}</Text>
                <Text>{JSON.stringify(this.state, null, 3)}</Text>
                <Text style={styles.title}>Blutooth Opended:{this.state.bleOpend?"true":"false"} <Text>Open BLE Before Scanning</Text> </Text>
                <View>
                  <Switch value={this.state.bleOpend} onValueChange={(v)=>{
                  this.setState({
                      loading:true
                  })
                  if(!v){
                      BluetoothManager.disableBluetooth().then(()=>{
                          this.setState({
                              bleOpend:false,
                              loading:false,
                              foundDs:[],
                              pairedDs:[]
                          });
                      },(err)=>{alert(err)});

                  }else{
                      BluetoothManager.enableBluetooth().then((r)=>{
                          var paired = [];
                          if(r && r.length>0){
                              for(var i=0;i<r.length;i++){
                                  try{
                                      paired.push(JSON.parse(r[i]));
                                  }catch(e){
                                      //ignore
                                  }
                              }
                          }
                          this.setState({
                              bleOpend:true,
                              loading:false,
                              pairedDs:paired
                          })
                      },(err)=>{
                          this.setState({
                              loading:false
                          })
                          alert(err)
                      });
                  }
                  }}/>
                  <Button disabled={this.state.loading || !this.state.bleOpend} onPress={()=>{
                      this._scan();
                  }} title="Scan"/>
                </View>
                <Text  style={styles.title}>Connected:<Text style={{color:"blue"}}>{!this.state.name ? 'No Devices' : this.state.name}</Text></Text>
                <Text  style={styles.title}>Found(tap to connect):</Text>
                {this.state.loading ? (<ActivityIndicator animating={true}/>) : null}
                <View style={{flex:1,flexDirection:"column"}}>
                {
                    this._renderRow(this.state.foundDs)
                }
                </View>
                <Text  style={styles.title}>Paired:</Text>
                {this.state.loading ? (<ActivityIndicator animating={true}/>) : null}
                <View style={{flex:1,flexDirection:"column"}}>
                {
                    this._renderRow(this.state.pairedDs)
                }
                <Text>{''}</Text>
                <Button onPress={async () => {
                    await BluetoothEscposPrinter.printBarCode("123456789012", BluetoothEscposPrinter.BARCODETYPE.JAN13, 3, 120, 0, 2);
                    await  BluetoothEscposPrinter.printText("\r\n\r\n\r\n", {});
                }} title="Imprimir Código de Barra"/>

                <Text>{''}</Text>
                <Button onPress={async () => {
                    await BluetoothEscposPrinter.printerUnderLine(2);
                    await  BluetoothEscposPrinter.printText("Hello World\r\n", {
                        encoding: 'GBK',
                        codepage: 0,
                        widthtimes: 0,
                        heigthtimes: 0,
                        fonttype: 1
                    });
                    await BluetoothEscposPrinter.printerUnderLine(0);
                    await  BluetoothEscposPrinter.printText("\r\n\r\n\r\n", {});
                }} title="Imprimir Hello World"/>

                 <Button disabled={this.state.loading || this.state.boundAddress.length <= 0}
                        title="Imprimir Recibo - Teste" onPress={async () => {
                    try {
                        await BluetoothEscposPrinter.printerInit();
                        await BluetoothEscposPrinter.printerLeftSpace(0);

                        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
                        await BluetoothEscposPrinter.setBlob(0);
                        await  BluetoothEscposPrinter.printText("广州俊烨\r\n", {
                            encoding: 'GBK',
                            codepage: 0,
                            widthtimes: 3,
                            heigthtimes: 3,
                            fonttype: 1
                        });
                        await BluetoothEscposPrinter.setBlob(0);
                        await  BluetoothEscposPrinter.printText("销售单\r\n", {
                            encoding: 'GBK',
                            codepage: 0,
                            widthtimes: 0,
                            heigthtimes: 0,
                            fonttype: 1
                        });
                        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
                        await  BluetoothEscposPrinter.printText("AA：aa\r\n", {});
                        await  BluetoothEscposPrinter.printText("BB：xsd201909210000001\r\n", {});
                        await  BluetoothEscposPrinter.printText("Data：" + (dateFormat(new Date(), "yyyy-mm-dd h:MM:ss")) + "\r\n", {});
                        await  BluetoothEscposPrinter.printText("DD：18664896621\r\n", {});
                        await  BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
                        let columnWidths = [12, 6, 6, 8];
                        await BluetoothEscposPrinter.printColumn(columnWidths,
                            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
                            ["AA", 'BB', 'CC', 'DD'], {});
                        await BluetoothEscposPrinter.printColumn(columnWidths,
                            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
                            ["React-Native-Imprimir-Teste-1", '1', '32000', '32000'], {});
                        await  BluetoothEscposPrinter.printText("\r\n", {});
                        await BluetoothEscposPrinter.printColumn(columnWidths,
                            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
                            ["React-Native-Imprimir-Teste-2", '1', '32000', '32000'], {});
                        await  BluetoothEscposPrinter.printText("\r\n", {});
                        await  BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
                        await BluetoothEscposPrinter.printColumn([12, 8, 12],
                            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
                            ["DDD", '2', '64000'], {});
                        await  BluetoothEscposPrinter.printText("\r\n", {});
                        await  BluetoothEscposPrinter.printText("Porcentagem：100%\r\n", {});
                        await  BluetoothEscposPrinter.printText("Preço：64000.00\r\n", {});
                        await  BluetoothEscposPrinter.printText("Desconto：0.00\r\n", {});
                        await  BluetoothEscposPrinter.printText("Retorno：0.00\r\n", {});
                        await  BluetoothEscposPrinter.printText("Total：64000.00\r\n", {});
                        await  BluetoothEscposPrinter.printText("Taxa：CFG\r\n", {});
                        await  BluetoothEscposPrinter.printText("Taxa 2：YE\r\n", {});
                        await  BluetoothEscposPrinter.printText("Taxa 3：SE\r\n", {});
                        await  BluetoothEscposPrinter.printText("Data：" + (dateFormat(new Date(), "yyyy-mm-dd h:MM:ss")) + "\r\n", {});
                        await  BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
                        await  BluetoothEscposPrinter.printText("A：\r\n", {});
                        await  BluetoothEscposPrinter.printText("B:\r\n\r\n", {});
                        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
                        await  BluetoothEscposPrinter.printText("Bluetooth Esc Pos Printer\r\n\r\n\r\n", {});
                        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
                        await  BluetoothEscposPrinter.printText("\r\n\r\n\r\n", {});
                    } catch (e) {
                        alert(e.message || "ERROR");
                    }

                }}/>
                </View>
            </ScrollView>
        );
    }

    _scan() {
        this.setState({
            loading: true
        })
        BluetoothManager.scanDevices()
            .then((s)=> {
                var ss = s;
                var found = ss.found;
                try {
                    found = JSON.parse(found);//@FIX_it: the parse action too weired..
                } catch (e) {
                    //ignore
                }
                var fds =  this.state.foundDs;
                if(found && found.length){
                    fds = found;
                }
                this.setState({
                    foundDs:fds,
                    loading: false
                });
            }, (er)=> {
                this.setState({
                    loading: false
                })
                alert('error' + JSON.stringify(er));
            });
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },

    title:{
        width:width,
        backgroundColor:"#eee",
        color:"#232323",
        paddingLeft:8,
        paddingVertical:4,
        textAlign:"left"
    },
    wtf:{
        flex:1,
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center"
    },
    name:{
        flex:1,
        textAlign:"left"
    },
    address:{
        flex:1,
        textAlign:"right"
    }
});