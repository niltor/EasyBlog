﻿using BuildSite;


var input = args.FirstOrDefault() ?? "./";
var output = args.Skip(1).FirstOrDefault() ?? "./_site";
var environment = args.Skip(2).FirstOrDefault() ?? "Development";


var builder = new HtmlBuilder(input, output);

try
{
    if (environment.Equals("Production", StringComparison.OrdinalIgnoreCase))
    {
        builder.EnableBaseUrl();
    }

    builder.BuildWebSite();
}
catch (Exception e)
{
    Console.WriteLine(e.Message + e.StackTrace);
    Console.WriteLine("请尝试在根目录下运行本项目");
}
