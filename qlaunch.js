var filePath = WScript.arguments(0);

var fso = WScript.CreateObject('Scripting.FileSystemObject');
var shell = WScript.CreateObject('WScript.Shell');
var file = fso.OpenTextFile(filePath);

var topStr = file.Read(300);
var match = topStr.match(/Version=([0-9.]+)/);

if(!match) {
  WScript.Echo('Invalid Q-Sys design file');
  WScript.Quit();
}

var majorminor = match[1].split('.').slice(0,2).join('.');

/*** Enumerate Q-Sys Designer Versions installed ***/
var net = WScript.CreateObject('WScript.Network');
var reg = {
  _: GetObject('winmgmts:{impersonationLevel=impersonate}!\\\\'+(net.ComputerName)+'\\root\\default:StdRegProv')
};

reg._Exec = function(method, params) {
  var objMethod = this._.Methods_.Item(method);
  var objParamsIn = objMethod.InParameters.SpawnInstance_();
  for(var i in params) {
    objParamsIn[i] = params[i];
  }
  var r = this._.ExecMethod_(objMethod.Name, objParamsIn);
  if(r.ReturnValue !== 0) { return; }
  return r;
}

reg.EnumKey = function(hive, key) {
  return this._Exec('EnumKey', {
    hDefKey: hive,
    sSubKeyName: key
  });
}

reg.EnumValues = function(hive, key) {
  var value_result = this._Exec('EnumValues', {
    hDefKey: hive,
    sSubKeyName: key
  });
  if (value_result.sNames == null) { return; }
  var value_names = value_result.sNames.toArray();
  var value_types = value_result.Types.toArray();
  var values = [];
  for(var i in value_names) {
    values[i] = {
      name: value_names[i],
      type: value_types[i]
    }
  }
  return values;
}

reg._GetValue = function(type, hive, key, name) {
  return this._Exec('Get' + type + 'Value', {
    hDefKey: hive,
    sSubKeyName: key,
    sValueName: name
  });
}

reg.GetValues = function(hive, key) {
  var values = this.EnumValues(hive, key);
  var dict = {};
  var _reg = this;
  function GetValue(type, name) {
    return _reg._GetValue(type, hive, key, values[i].name);
  }
  for(var i in values) {
    var v;
    switch(values[i].type) {
      case 1: { // REG_SZ
        v = GetValue('String', values[i].name).sValue;
      } break;
      case 2: { // REG_EXPAND_SZ
        v = GetValue('ExpandedString', values[i].name).sValue;
      } break;
      case 3: { // REG_BINARY
        v = GetValue('Binary', values[i].name).uValue.toArray();
      } break;
      case 4: { // REG_DWORD
        v = GetValue('DWORD', values[i].name).uValue;
      } break;
      case 7: { // REG_MULTI_SZ
        v = GetValue('MultiString', values[i].name).sValue.toArray();
      } break;
      case 11: { // REG_QWORD
        v = GetValue('QWORD', values[i].name).uValue;
      } break;
    }
    dict[values[i].name] = v;
  }
  return dict;
}

// Read uninstall entries
var HKLM = 0x80000002;
var uninstallKey = "Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall";
var programs = reg.EnumKey(HKLM, uninstallKey);

// If successful, iterate the subkeys...
if (programs.ReturnValue !== 0 || programs.sNames == null) { WScript.Quit(); }
var program_names = programs.sNames.toArray();
for(var i in program_names) { program_names[i] = uninstallKey + '\\' + program_names[i]; }

for (var i = 0; i < program_names.length; ++i) {
  var name = reg._GetValue('String', HKLM, program_names[i], 'DisplayName');
  var version = reg._GetValue('String', HKLM, program_names[i], 'DisplayVersion');
  if(!name || name.ReturnValue !== 0 || !version || version.ReturnValue !== 0) { continue; }
  if(name.sValue.indexOf('Q-SYS Designer') !== -1) {
    var prog_majorminor = version.sValue.split('.').slice(0,2).join('.');
    if(prog_majorminor == majorminor) {
      var location = reg._GetValue('String', HKLM, program_names[i], 'InstallLocation').sValue;
      var exec = '"' + location + '\\Q-Sys Designer.exe" "' + filePath + '"';
      shell.Exec(exec);
      //WScript.Echo(exec);
      WScript.Quit();
    }   
  }
}